import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import exifr from 'exifr';

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const CATEGORIES = new Set(['Heat', 'Flooding', 'Water shortage', 'Agriculture', 'Environment', 'Infrastructure', 'Waste', 'Other']);
const STATUSES = new Set(['pending', 'verified', 'rejected']);
const LOCATION_SOURCES = new Set(['exif', 'device', 'manual', 'unavailable']);

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', extension: 'jpg' };
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { mimeType: 'image/png', extension: 'png' };
  }
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mimeType: 'image/webp', extension: 'webp' };
  }
  return null;
}

function cleanText(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function numericCoordinate(value, min, max) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : Number.NaN;
}

function isLocalRequest(req) {
  const address = req.ip || req.socket?.remoteAddress || '';
  return address === '127.0.0.1' || address === '::1' || address === '::ffff:127.0.0.1';
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createPhotoEvidenceRouter({ rootDir, getSurveyData }) {
  const router = express.Router();
  const evidenceDir = path.join(rootDir, 'data', 'photo_evidence');
  const photosDir = path.join(evidenceDir, 'photos');
  const registryPath = path.join(evidenceDir, 'registry.json');
  fs.mkdirSync(photosDir, { recursive: true });
  if (!fs.existsSync(registryPath)) fs.writeFileSync(registryPath, '[]\n', 'utf8');

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 16, parts: 17 }
  });

  const readRegistry = () => {
    try {
      const parsed = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeRegistry = (items) => {
    const temporaryPath = `${registryPath}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporaryPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
    fs.renameSync(temporaryPath, registryPath);
  };

  const publicItem = (item) => {
    const { storedName: _storedName, ...publicFile } = item.file;
    void _storedName;
    return { ...item, file: publicFile, imageUrl: `/api/photo-evidence/${item.id}/image` };
  };

  const participantFor = (participantId) => {
    const records = getSurveyData()?.records || [];
    const index = records.findIndex(record => record.id === participantId);
    if (index < 0) return null;
    return {
      id: records[index].id,
      label: `Participant ${String(index + 1).padStart(2, '0')}`,
      rowNumber: records[index].rowNumber,
      pageNumber: records[index].pageNumber
    };
  };

  const adminGuard = (req, res, next) => {
    const configuredKey = String(process.env.CLIMORA_ADMIN_KEY || '').trim();
    if (!configuredKey && isLocalRequest(req)) return next();
    if (configuredKey && safeEqual(req.get('x-admin-key'), configuredKey)) return next();
    return res.status(403).json({
      error: 'Admin access required',
      message: configuredKey
        ? 'Enter the configured Climora admin key to manage photo evidence.'
        : 'Photo evidence can only be managed from localhost unless CLIMORA_ADMIN_KEY is configured.'
    });
  };

  const summaryFor = (items) => ({
    total: items.length,
    verified: items.filter(item => item.status === 'verified').length,
    withCoordinates: items.filter(item => item.location.source !== 'unavailable').length,
    participantsWithEvidence: new Set(items.map(item => item.participant.id)).size,
    byCategory: Array.from(CATEGORIES).map(category => ({
      category,
      count: items.filter(item => item.category === category).length
    })).filter(item => item.count > 0)
  });

  router.get('/', (req, res) => {
    let items = readRegistry();
    const { participantId, category, status, locationSource, q } = req.query;
    if (participantId) items = items.filter(item => item.participant.id === participantId);
    if (category) items = items.filter(item => item.category === category);
    if (status) items = items.filter(item => item.status === status);
    if (locationSource) items = items.filter(item => item.location.source === locationSource);
    if (q) {
      const query = String(q).toLowerCase();
      items = items.filter(item => [item.title, item.description, item.location.label, item.participant.label, item.category]
        .some(value => String(value || '').toLowerCase().includes(query)));
    }
    items.sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
    res.json({ items: items.map(publicItem), summary: summaryFor(readRegistry()) });
  });

  router.get('/summary', (_req, res) => {
    res.json(summaryFor(readRegistry()));
  });

  router.get('/:id/image', (req, res) => {
    const item = readRegistry().find(record => record.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Photo evidence not found' });
    const filePath = path.join(photosDir, item.file.storedName);
    if (!filePath.startsWith(`${photosDir}${path.sep}`) || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file not found' });
    }
    res.setHeader('Content-Type', item.file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${item.file.safeOriginalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return fs.createReadStream(filePath).pipe(res);
  });

  router.post('/', adminGuard, upload.single('photo'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'A photo file is required.' });
    const imageType = detectImageType(req.file.buffer);
    if (!imageType) return res.status(415).json({ error: 'The uploaded file is not a valid JPEG, PNG, or WebP image.' });

    const participant = participantFor(cleanText(req.body.participantId, 32));
    if (!participant) return res.status(400).json({ error: 'Select one of the 51 valid PDF participants.' });

    const title = cleanText(req.body.title, 100);
    const description = cleanText(req.body.description, 600);
    const category = cleanText(req.body.category, 40);
    const status = cleanText(req.body.status || 'pending', 20).toLowerCase();
    if (!title) return res.status(400).json({ error: 'Evidence title is required.' });
    if (!CATEGORIES.has(category)) return res.status(400).json({ error: 'Select a valid evidence category.' });
    if (!STATUSES.has(status)) return res.status(400).json({ error: 'Select a valid verification status.' });

    const latitude = numericCoordinate(req.body.latitude, -90, 90);
    const longitude = numericCoordinate(req.body.longitude, -180, 180);
    if (Number.isNaN(latitude) || Number.isNaN(longitude) || (latitude === null) !== (longitude === null)) {
      return res.status(400).json({ error: 'Latitude and longitude must be supplied together and within valid ranges.' });
    }

    let exifGps;
    let exifMetadata;
    try {
      [exifGps, exifMetadata] = await Promise.all([
        exifr.gps(req.file.buffer),
        exifr.parse(req.file.buffer, ['DateTimeOriginal', 'CreateDate'])
      ]);
    } catch {
      exifGps = undefined;
      exifMetadata = undefined;
    }

    const submittedSource = cleanText(req.body.locationSource, 20).toLowerCase();
    const overrideExif = String(req.body.overrideExif || '') === 'true';
    if (submittedSource && !['device', 'manual'].includes(submittedSource)) {
      return res.status(400).json({ error: 'Uploaded coordinates must be labeled as device GPS or manual entry.' });
    }
    if (submittedSource && (latitude === null || longitude === null)) {
      return res.status(400).json({ error: 'Latitude and longitude are required for the selected location method.' });
    }
    const validExif = Number.isFinite(exifGps?.latitude) && Number.isFinite(exifGps?.longitude);
    let resolvedLatitude = null;
    let resolvedLongitude = null;
    let resolvedSource = 'unavailable';
    if (!overrideExif && validExif) {
      resolvedLatitude = exifGps.latitude;
      resolvedLongitude = exifGps.longitude;
      resolvedSource = 'exif';
    } else if (latitude !== null && longitude !== null && ['device', 'manual'].includes(submittedSource)) {
      resolvedLatitude = latitude;
      resolvedLongitude = longitude;
      resolvedSource = submittedSource;
    } else if (validExif) {
      resolvedLatitude = exifGps.latitude;
      resolvedLongitude = exifGps.longitude;
      resolvedSource = 'exif';
    }

    const checksum = crypto.createHash('sha256').update(req.file.buffer).digest('hex');
    const items = readRegistry();
    if (items.some(item => item.participant.id === participant.id && item.file.checksumSha256 === checksum)) {
      return res.status(409).json({ error: 'This participant already has the same photo attached.' });
    }

    const now = new Date().toISOString();
    const id = `PHOTO-${crypto.randomUUID()}`;
    const storedName = `${id}.${imageType.extension}`;
    const safeOriginalName = path.basename(req.file.originalname || `evidence.${imageType.extension}`).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
    const metadataDate = exifMetadata?.DateTimeOriginal || exifMetadata?.CreateDate;
    const submittedDate = cleanText(req.body.capturedAt, 40);
    const parsedDate = submittedDate ? new Date(submittedDate) : metadataDate instanceof Date ? metadataDate : null;
    if (submittedDate && Number.isNaN(parsedDate?.getTime())) {
      fs.rmSync(path.join(photosDir, storedName), { force: true });
      return res.status(400).json({ error: 'Capture date is invalid.' });
    }

    const item = {
      id,
      participant,
      title,
      description,
      category,
      status,
      location: {
        latitude: resolvedLatitude,
        longitude: resolvedLongitude,
        source: resolvedSource,
        accuracyMeters: resolvedSource === 'device' && Number.isFinite(Number(req.body.accuracyMeters)) ? Math.max(0, Number(req.body.accuracyMeters)) : null,
        label: cleanText(req.body.locationLabel, 120)
      },
      capturedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
      uploadedAt: now,
      updatedAt: now,
      fieldEvidence: true,
      file: {
        storedName,
        safeOriginalName,
        mimeType: imageType.mimeType,
        sizeBytes: req.file.size,
        checksumSha256: checksum
      }
    };

    fs.writeFileSync(path.join(photosDir, storedName), req.file.buffer, { flag: 'wx' });
    try {
      writeRegistry([...items, item]);
    } catch (error) {
      fs.rmSync(path.join(photosDir, storedName), { force: true });
      throw error;
    }
    return res.status(201).json(publicItem(item));
  });

  router.patch('/:id', adminGuard, (req, res) => {
    const items = readRegistry();
    const index = items.findIndex(item => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Photo evidence not found' });

    const current = items[index];
    const participant = req.body.participantId ? participantFor(cleanText(req.body.participantId, 32)) : current.participant;
    if (!participant) return res.status(400).json({ error: 'Select one of the 51 valid PDF participants.' });
    const category = req.body.category ? cleanText(req.body.category, 40) : current.category;
    const status = req.body.status ? cleanText(req.body.status, 20).toLowerCase() : current.status;
    if (!CATEGORIES.has(category) || !STATUSES.has(status)) return res.status(400).json({ error: 'Invalid category or status.' });

    let location = current.location;
    if ('latitude' in req.body || 'longitude' in req.body || 'locationSource' in req.body || 'locationLabel' in req.body) {
      const latitude = numericCoordinate(req.body.latitude, -90, 90);
      const longitude = numericCoordinate(req.body.longitude, -180, 180);
      const source = cleanText(req.body.locationSource || 'manual', 20).toLowerCase();
      if (Number.isNaN(latitude) || Number.isNaN(longitude) || (latitude === null) !== (longitude === null) || !LOCATION_SOURCES.has(source)) {
        return res.status(400).json({ error: 'Invalid location metadata.' });
      }
      if ((source === 'unavailable') !== (latitude === null)) {
        return res.status(400).json({ error: 'Unavailable locations cannot contain coordinates, and coordinate sources require both values.' });
      }
      location = {
        latitude,
        longitude,
        source: latitude === null ? 'unavailable' : source,
        accuracyMeters: source === 'device' && Number.isFinite(Number(req.body.accuracyMeters)) ? Math.max(0, Number(req.body.accuracyMeters)) : null,
        label: cleanText(req.body.locationLabel, 120)
      };
    }

    let capturedAt = current.capturedAt;
    if (req.body.capturedAt !== undefined) {
      if (!req.body.capturedAt) capturedAt = null;
      else {
        const parsedCapturedAt = new Date(req.body.capturedAt);
        if (Number.isNaN(parsedCapturedAt.getTime())) return res.status(400).json({ error: 'Capture date is invalid.' });
        capturedAt = parsedCapturedAt.toISOString();
      }
    }

    const next = {
      ...current,
      participant,
      title: req.body.title === undefined ? current.title : cleanText(req.body.title, 100),
      description: req.body.description === undefined ? current.description : cleanText(req.body.description, 600),
      category,
      status,
      location,
      capturedAt,
      updatedAt: new Date().toISOString()
    };
    if (!next.title) return res.status(400).json({ error: 'Evidence title is required.' });
    items[index] = next;
    writeRegistry(items);
    return res.json(publicItem(next));
  });

  router.delete('/:id', adminGuard, (req, res) => {
    const items = readRegistry();
    const index = items.findIndex(item => item.id === req.params.id);
    if (index < 0) return res.status(404).json({ error: 'Photo evidence not found' });
    const [removed] = items.splice(index, 1);
    writeRegistry(items);
    fs.rmSync(path.join(photosDir, removed.file.storedName), { force: true });
    return res.status(204).end();
  });

  router.use((error, _req, res, next) => {
    void next;
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Photo must be 8 MB or smaller.' });
    }
    return res.status(400).json({ error: error.message || 'Photo evidence request failed.' });
  });

  return router;
}
