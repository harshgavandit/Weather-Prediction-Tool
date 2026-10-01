import React from 'react';
import { createPortal } from 'react-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Camera, CheckCircle2, Compass, ExternalLink, Eye, FileImage, Filter, Globe2, ImagePlus,
  Layers3, LoaderCircle, LocateFixed, MapPin, Pencil, Search, ShieldCheck, Sparkles, Trash2,
  UploadCloud, X
} from 'lucide-react';
import { deletePhotoEvidence, updatePhotoEvidence, uploadPhotoEvidence } from '../services/api';
import {
  buildParticipantIllustrations, illustrativeFallbackUrl, ParticipantIllustration
} from '../data/illustrativeImages';
import {
  PhotoEvidence, PhotoEvidenceCategory, PhotoEvidenceResponse, PhotoEvidenceStatus, SurveyResponseData
} from '../types';

interface Props {
  surveyData: SurveyResponseData;
  evidence: PhotoEvidenceResponse;
  onEvidenceChange: (next: PhotoEvidenceResponse) => void;
}

const categories: PhotoEvidenceCategory[] = ['Heat', 'Flooding', 'Water shortage', 'Agriculture', 'Environment', 'Infrastructure', 'Waste', 'Other'];
const statuses: Array<{ value: PhotoEvidenceStatus; label: string }> = [
  { value: 'pending', label: 'Pending review' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' }
];

const blankForm = {
  participantId: 'RESP-001', title: '', description: '', category: 'Environment' as PhotoEvidenceCategory,
  status: 'pending' as PhotoEvidenceStatus, capturedAt: '', locationLabel: '', latitude: '', longitude: '',
  accuracyMeters: '', locationMode: 'auto' as 'auto' | 'device' | 'manual'
};

const toDateInput = (value: string | null) => value ? new Date(value).toISOString().slice(0, 16) : '';
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not recorded';
const statusClass = (status: PhotoEvidenceStatus) => status === 'verified' ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/10' : status === 'rejected' ? 'text-rose-300 border-rose-500/25 bg-rose-500/10' : 'text-amber-300 border-amber-500/25 bg-amber-500/10';

function summarize(items: PhotoEvidence[]): PhotoEvidenceResponse['summary'] {
  return {
    total: items.length,
    verified: items.filter(item => item.status === 'verified').length,
    withCoordinates: items.filter(item => item.location.source !== 'unavailable').length,
    participantsWithEvidence: new Set(items.map(item => item.participant.id)).size,
    byCategory: categories.map(category => ({ category, count: items.filter(item => item.category === category).length })).filter(item => item.count > 0)
  };
}

export const GeoPhotoEvidence: React.FC<Props> = ({ surveyData, evidence, onEvidenceChange }) => {
  const [form, setForm] = React.useState(blankForm);
  const [photo, setPhoto] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = React.useState('');
  const [participantFilter, setParticipantFilter] = React.useState('all');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [illustrationSearch, setIllustrationSearch] = React.useState('');
  const [illustrationTheme, setIllustrationTheme] = React.useState('all');
  const [showAllIllustrations, setShowAllIllustrations] = React.useState(false);
  const [selectedIllustration, setSelectedIllustration] = React.useState<ParticipantIllustration | null>(null);
  const [editing, setEditing] = React.useState<PhotoEvidence | null>(null);
  const [adminKey, setAdminKey] = React.useState(() => sessionStorage.getItem('climora-admin-key') || '');
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const chooseFile = (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Choose a JPEG, PNG, or WebP photo.' });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'The photo must be 8 MB or smaller.' });
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setMessage(null);
  };

  const useDeviceLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'This browser does not support device location. Use manual coordinates instead.' });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(position => {
      setForm(previous => ({
        ...previous,
        latitude: position.coords.latitude.toFixed(6),
        longitude: position.coords.longitude.toFixed(6),
        accuracyMeters: Math.round(position.coords.accuracy).toString(),
        locationMode: 'device'
      }));
      setIsLocating(false);
      setMessage({ type: 'success', text: 'Device coordinates captured. You can review them before uploading.' });
    }, error => {
      setIsLocating(false);
      setMessage({ type: 'error', text: error.code === 1 ? 'Location permission was denied. Use manual coordinates or photo EXIF instead.' : 'Device location could not be captured.' });
    }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
  };

  const submitUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!photo) {
      setMessage({ type: 'error', text: 'Select a photo before submitting.' });
      return;
    }
    setIsSubmitting(true);
    setMessage(null);
    try {
      const body = new FormData();
      body.append('photo', photo);
      body.append('participantId', form.participantId);
      body.append('title', form.title);
      body.append('description', form.description);
      body.append('category', form.category);
      body.append('status', form.status);
      body.append('capturedAt', form.capturedAt);
      body.append('locationLabel', form.locationLabel);
      if (form.locationMode !== 'auto') {
        body.append('latitude', form.latitude);
        body.append('longitude', form.longitude);
        body.append('accuracyMeters', form.accuracyMeters);
        body.append('locationSource', form.locationMode);
        body.append('overrideExif', 'true');
      }
      const created = await uploadPhotoEvidence(body, adminKey);
      const items = [created, ...evidence.items];
      onEvidenceChange({ items, summary: summarize(items) });
      if (adminKey) sessionStorage.setItem('climora-admin-key', adminKey);
      setForm(previous => ({ ...blankForm, participantId: previous.participantId }));
      setPhoto(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview('');
      if (fileInput.current) fileInput.current.value = '';
      setMessage({ type: 'success', text: `${created.title} was attached to ${created.participant.label}.` });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'The photo could not be uploaded.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    const data = new FormData(event.currentTarget);
    setIsSubmitting(true);
    try {
      const updated = await updatePhotoEvidence(editing.id, {
        participantId: data.get('participantId'), title: data.get('title'), description: data.get('description'),
        category: data.get('category'), status: data.get('status'), capturedAt: data.get('capturedAt'),
        locationLabel: data.get('locationLabel'), latitude: data.get('latitude'), longitude: data.get('longitude'),
        locationSource: data.get('locationSource')
      }, adminKey);
      const items = evidence.items.map(item => item.id === updated.id ? updated : item);
      onEvidenceChange({ items, summary: summarize(items) });
      setEditing(null);
      setMessage({ type: 'success', text: 'Photo evidence metadata was updated.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'The evidence could not be updated.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeEvidence = async (item: PhotoEvidence) => {
    if (!window.confirm(`Delete “${item.title}” from ${item.participant.label}? The stored photo will also be removed.`)) return;
    setIsSubmitting(true);
    try {
      await deletePhotoEvidence(item.id, adminKey);
      const items = evidence.items.filter(record => record.id !== item.id);
      onEvidenceChange({ items, summary: summarize(items) });
      setMessage({ type: 'success', text: 'Photo evidence was permanently removed.' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'The photo could not be deleted.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = evidence.items.filter(item => {
    const query = search.trim().toLowerCase();
    const matchesText = !query || [item.title, item.description, item.location.label, item.participant.label, item.category].some(value => String(value || '').toLowerCase().includes(query));
    return matchesText && (participantFilter === 'all' || item.participant.id === participantFilter) && (categoryFilter === 'all' || item.category === categoryFilter) && (statusFilter === 'all' || item.status === statusFilter);
  });
  const metrics: Array<{ label: string; value: number; icon: LucideIcon; tone: string }> = [
    { label: 'Photos stored', value: evidence.summary.total, icon: FileImage, tone: 'text-cyan-300' },
    { label: 'Verified evidence', value: evidence.summary.verified, icon: CheckCircle2, tone: 'text-emerald-300' },
    { label: 'With coordinates', value: evidence.summary.withCoordinates, icon: MapPin, tone: 'text-violet-300' },
    { label: 'Participants covered', value: evidence.summary.participantsWithEvidence, icon: Compass, tone: 'text-amber-300' }
  ];
  const illustrations = React.useMemo(() => buildParticipantIllustrations(surveyData.records), [surveyData.records]);
  const illustrationThemes = React.useMemo(() => [...new Set(illustrations.map(item => item.image.theme))].sort(), [illustrations]);
  const filteredIllustrations = illustrations.filter(item => {
    const query = illustrationSearch.trim().toLowerCase();
    const matchesText = !query || [item.participantLabel, item.problem, item.preferredAction, item.image.title, item.image.theme]
      .some(value => value.toLowerCase().includes(query));
    return matchesText && (illustrationTheme === 'all' || item.image.theme === illustrationTheme);
  });
  const visibleIllustrations = showAllIllustrations ? filteredIllustrations : filteredIllustrations.slice(0, 12);

  return <div className="workspace-enter space-y-6">
    <section className="hero-panel p-6 md:p-8">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-3xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-cyan-300"><Camera className="h-3.5 w-3.5"/> Participant-linked field evidence</div><h1 className="display-title">Geo-tagged photo evidence</h1><p className="mt-4 text-sm leading-6 text-slate-300">Attach field photos to one of the 51 anonymous PDF participants. Photos are stored separately from the survey source, and every coordinate states whether it came from EXIF, device GPS, or manual entry.</p></div>
        <div className="rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4 text-xs leading-5 text-amber-100/80 xl:max-w-sm"><ShieldCheck className="mb-2 h-5 w-5 text-amber-300"/><strong className="block text-amber-200">Evidence boundary</strong>Photo evidence does not modify PDF answers or survey percentages. Never upload identifiable faces or private locations without permission.</div>
      </div>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon, tone }) => <article className="data-panel p-4" key={label}><Icon className={`h-5 w-5 ${tone}`}/><strong className="mt-4 block text-2xl text-white">{value}</strong><span className="mt-1 block text-[10px] uppercase tracking-wider text-slate-500">{label}</span></article>)}
    </section>

    <section className="illustration-atlas overflow-hidden rounded-[28px] border border-cyan-300/15">
      <div className="relative z-10 p-5 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[.16em] text-cyan-200"><Sparkles className="h-3.5 w-3.5"/> Illustrative response atlas</div>
            <h2 className="text-2xl font-black tracking-[-.04em] text-white md:text-4xl">51 responses. One visual climate story.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">Each participant is paired with a credited internet image selected from their PDF answers to Q14 and Q15. The imagery makes patterns easier to scan while preserving the original response beneath every card.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 xl:w-[390px]">
            {[['51', 'responses linked'], ['7', 'credited sources'], ['0', 'evidence photos added']].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-slate-950/35 p-3 backdrop-blur"><strong className="block text-xl text-white">{value}</strong><span className="mt-1 block text-[8px] uppercase leading-4 tracking-wider text-slate-400">{label}</span></div>)}
          </div>
        </div>

        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300/20 bg-amber-300/[.07] p-4 text-xs leading-5 text-amber-100/80">
          <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"/>
          <p><strong className="block text-amber-200">Illustrative web imagery — not field evidence</strong>These photos were not submitted by participants, are not geo-tagged to survey locations, and do not prove local conditions. They are excluded from the evidence counts above.</p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_260px_auto]">
          <label className="photo-filter"><Search/><input value={illustrationSearch} onChange={event => setIllustrationSearch(event.target.value)} placeholder="Search participant, problem or action"/></label>
          <select className="photo-filter-select" value={illustrationTheme} onChange={event => setIllustrationTheme(event.target.value)}><option value="all">All visual themes</option>{illustrationThemes.map(theme => <option key={theme}>{theme}</option>)}</select>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/35 px-4 text-[10px] font-bold text-cyan-200"><Layers3 className="h-4 w-4"/>{filteredIllustrations.length} linked responses</div>
        </div>

        {visibleIllustrations.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-700 px-6 py-14 text-center text-xs text-slate-400">No participant illustrations match these filters.</div> : <div className="mt-5 grid auto-rows-[270px] gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleIllustrations.map((item, index) => <button type="button" onClick={() => setSelectedIllustration(item)} key={item.participantId} className={`illustration-card group text-left ${index === 0 && filteredIllustrations.length > 1 ? 'md:col-span-2 md:row-span-2 xl:col-span-2' : ''}`}>
          <img src={item.image.imageUrl} alt={item.image.alt} loading="lazy" referrerPolicy="no-referrer" onError={event => { if (event.currentTarget.src !== illustrativeFallbackUrl) event.currentTarget.src = illustrativeFallbackUrl; }}/>
          <div className="illustration-card-shade"/>
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <span className="rounded-full border border-white/15 bg-slate-950/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur">{item.participantLabel}</span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider text-cyan-100 backdrop-blur">Illustrative web image</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-cyan-200">{item.image.theme}</p>
            <h3 className={`mt-1.5 font-black tracking-[-.025em] text-white ${index === 0 ? 'text-xl md:text-3xl' : 'text-lg'}`}>{item.image.title}</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-[9px]"><span className="rounded-full bg-rose-400/15 px-2.5 py-1 text-rose-100">Q14 · {item.problem}</span><span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-100">Q15 · {item.preferredAction}</span></div>
            <div className="mt-3 flex items-center justify-between gap-3 text-[9px] text-slate-300"><span>{item.image.credit}</span><span className="flex items-center gap-1 font-bold text-white">Inspect link <Eye className="h-3 w-3"/></span></div>
          </div>
        </button>)}</div>}

        {filteredIllustrations.length > 12 && <div className="mt-6 flex justify-center"><button type="button" onClick={() => setShowAllIllustrations(value => !value)} className="secondary-cta">{showAllIllustrations ? 'Show featured set' : `Show all ${filteredIllustrations.length} responses`}<Layers3/></button></div>}
        <p className="mt-5 text-center text-[9px] leading-4 text-slate-500">Images remain hosted by their original web providers. Attribution and source links are available on every response card; an internet connection is required to display them.</p>
      </div>
    </section>

    <section className="data-panel overflow-hidden">
      <div className="border-b border-slate-800 p-5 md:p-6"><p className="eyebrow">Admin evidence manager</p><h2 className="mt-1 text-lg font-bold text-white">Attach a new field photo</h2><p className="mt-2 text-xs leading-5 text-slate-400">EXIF GPS is used first. Capture device coordinates or enter them manually only when you want to replace EXIF or when EXIF is unavailable.</p></div>
      <form onSubmit={submitUpload} className="grid gap-6 p-5 md:p-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="space-y-4">
          <div onDragOver={event => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={event => { event.preventDefault(); setIsDragging(false); chooseFile(event.dataTransfer.files[0]); }} className={`relative min-h-72 overflow-hidden rounded-2xl border border-dashed ${isDragging ? 'border-emerald-300 bg-emerald-400/10' : 'border-slate-700 bg-slate-950/40'} transition`}>
            {preview ? <><img src={preview} alt="Selected field evidence preview" className="h-72 w-full object-cover"/><button type="button" onClick={() => { setPhoto(null); setPreview(''); if (fileInput.current) fileInput.current.value = ''; }} className="absolute right-3 top-3 rounded-full border border-white/20 bg-slate-950/80 p-2 text-white"><X className="h-4 w-4"/></button></> : <button type="button" onClick={() => fileInput.current?.click()} className="flex h-72 w-full flex-col items-center justify-center gap-3 p-6 text-center"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><UploadCloud className="h-7 w-7"/></span><strong className="text-sm text-white">Drop a photo here or browse</strong><span className="max-w-xs text-[10px] leading-5 text-slate-500">JPEG, PNG or WebP · maximum 8 MB · GPS metadata checked securely on the server</span></button>}
            <input ref={fileInput} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => chooseFile(event.target.files?.[0])}/>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500">Admin key <span className="normal-case text-slate-600">(only required when configured)</span><input type="password" value={adminKey} onChange={event => setAdminKey(event.target.value)} placeholder="Optional for localhost" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-xs text-white outline-none focus:border-emerald-400/50"/></label>
        </div>

        <div className="grid content-start gap-4 sm:grid-cols-2">
          <label className="photo-field">Participant<select value={form.participantId} onChange={event => setForm({ ...form, participantId: event.target.value })}>{surveyData.records.map(record => <option key={record.id} value={record.id}>{record.respondentId} · PDF row {record.rowNumber}</option>)}</select></label>
          <label className="photo-field">Category<select value={form.category} onChange={event => setForm({ ...form, category: event.target.value as PhotoEvidenceCategory })}>{categories.map(category => <option key={category}>{category}</option>)}</select></label>
          <label className="photo-field sm:col-span-2">Evidence title<input required maxLength={100} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Example: Waterlogged road after heavy rain"/></label>
          <label className="photo-field sm:col-span-2">Description<textarea maxLength={600} rows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} placeholder="Describe only what is visible and known. Avoid unsupported conclusions."/></label>
          <label className="photo-field">Verification status<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value as PhotoEvidenceStatus })}>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
          <label className="photo-field">Photo capture date<input type="datetime-local" value={form.capturedAt} onChange={event => setForm({ ...form, capturedAt: event.target.value })}/></label>

          <div className="sm:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/35 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><strong className="text-xs text-white">Location evidence</strong><p className="mt-1 text-[10px] text-slate-500">Current mode: {form.locationMode === 'auto' ? 'EXIF first, otherwise unavailable' : form.locationMode === 'device' ? 'Device GPS' : 'Manual coordinates'}</p></div><div className="flex gap-2"><button type="button" onClick={useDeviceLocation} disabled={isLocating} className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-bold text-cyan-300 disabled:opacity-50">{isLocating ? <LoaderCircle className="mr-1 inline h-3 w-3 animate-spin"/> : <LocateFixed className="mr-1 inline h-3 w-3"/>}Use device GPS</button><button type="button" onClick={() => setForm({ ...form, locationMode: 'manual', latitude: '', longitude: '', accuracyMeters: '' })} className="rounded-lg border border-slate-700 px-3 py-2 text-[10px] font-bold text-slate-300">Enter manually</button></div></div>
            {form.locationMode !== 'auto' && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="photo-field">Latitude<input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={event => setForm({ ...form, latitude: event.target.value, locationMode: form.locationMode === 'device' ? 'device' : 'manual' })}/></label><label className="photo-field">Longitude<input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={event => setForm({ ...form, longitude: event.target.value, locationMode: form.locationMode === 'device' ? 'device' : 'manual' })}/></label></div>}
            <label className="photo-field mt-3">Location name <span className="normal-case text-slate-600">(optional)</span><input maxLength={120} value={form.locationLabel} onChange={event => setForm({ ...form, locationLabel: event.target.value })} placeholder="Example: College main gate"/></label>
          </div>

          {message && <div className={`sm:col-span-2 rounded-xl border px-4 py-3 text-xs ${message.type === 'success' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/20 bg-rose-500/10 text-rose-200'}`}>{message.text}</div>}
          <button disabled={isSubmitting} className="primary-cta sm:col-span-2 justify-center disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? <LoaderCircle className="animate-spin"/> : <ImagePlus/>}{isSubmitting ? 'Saving field evidence…' : 'Attach photo to participant'}</button>
        </div>
      </form>
    </section>

    <section className="data-panel p-5 md:p-6">
      <div className="panel-heading"><div><p className="eyebrow">Evidence gallery</p><h2>{filtered.length} of {evidence.items.length} photos</h2></div><Filter className="h-5 w-5 text-cyan-300"/></div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="photo-filter"><Search/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search evidence"/></label>
        <select className="photo-filter-select" value={participantFilter} onChange={event => setParticipantFilter(event.target.value)}><option value="all">All participants</option>{surveyData.records.map(record => <option key={record.id} value={record.id}>{record.respondentId}</option>)}</select>
        <select className="photo-filter-select" value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map(category => <option key={category}>{category}</option>)}</select>
        <select className="photo-filter-select" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select>
      </div>

      {filtered.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-slate-800 px-6 py-14 text-center"><FileImage className="mx-auto h-8 w-8 text-slate-600"/><h3 className="mt-4 text-sm font-bold text-white">{evidence.items.length ? 'No photos match these filters' : 'No photo evidence yet'}</h3><p className="mt-2 text-xs text-slate-500">{evidence.items.length ? 'Clear or change the filters to see more evidence.' : 'Use the manager above to attach the first geo-tagged field photo.'}</p></div> : <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <article key={item.id} className="group overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35 transition hover:-translate-y-0.5 hover:border-emerald-400/25">
        <div className="relative aspect-[16/10] overflow-hidden bg-slate-900"><img src={item.imageUrl} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"/><div className="absolute left-3 top-3 rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">{item.category}</div><div className={`absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase backdrop-blur ${statusClass(item.status)}`}>{item.status}</div></div>
        <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">{item.participant.label} · PDF row {item.participant.rowNumber}</p><h3 className="mt-1.5 text-sm font-bold text-white">{item.title}</h3></div><Camera className="h-4 w-4 shrink-0 text-slate-600"/></div><p className="mt-2 line-clamp-2 min-h-8 text-[10px] leading-4 text-slate-400">{item.description || 'No additional description.'}</p>
          <div className="mt-4 space-y-2 border-t border-slate-800 pt-3 text-[10px] text-slate-400"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-violet-300"/>{item.location.source === 'unavailable' ? 'Location unavailable' : item.location.label || `${item.location.latitude?.toFixed(5)}, ${item.location.longitude?.toFixed(5)}`}</span><strong className="uppercase text-slate-500">{item.location.source}</strong></div><div className="flex items-center justify-between"><span>Captured {formatDate(item.capturedAt)}</span><span>{Math.max(1, Math.round(item.file.sizeBytes / 1024))} KB</span></div></div>
          <div className="mt-4 flex flex-wrap gap-2">{item.location.latitude !== null && item.location.longitude !== null && <a className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[9px] font-bold text-cyan-300" href={`https://www.openstreetmap.org/?mlat=${item.location.latitude}&mlon=${item.location.longitude}#map=16/${item.location.latitude}/${item.location.longitude}`} target="_blank" rel="noreferrer">Open coordinates <ExternalLink className="ml-1 inline h-3 w-3"/></a>}<button onClick={() => setEditing(item)} className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-[9px] font-bold text-slate-300"><Pencil className="mr-1 inline h-3 w-3"/>Edit</button><button onClick={() => removeEvidence(item)} className="ml-auto rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-[9px] font-bold text-rose-300"><Trash2 className="mr-1 inline h-3 w-3"/>Delete</button></div>
        </div>
      </article>)}</div>}
    </section>

    {editing && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm"><form onSubmit={saveEdit} className="my-8 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"><div className="flex items-center justify-between border-b border-slate-800 p-5"><div><p className="eyebrow">Edit field evidence</p><h2 className="mt-1 text-lg font-bold text-white">{editing.title}</h2></div><button type="button" onClick={() => setEditing(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5"/></button></div><div className="grid gap-4 p-5 sm:grid-cols-2">
      <label className="photo-field">Participant<select name="participantId" defaultValue={editing.participant.id}>{surveyData.records.map(record => <option key={record.id} value={record.id}>{record.respondentId}</option>)}</select></label><label className="photo-field">Category<select name="category" defaultValue={editing.category}>{categories.map(category => <option key={category}>{category}</option>)}</select></label><label className="photo-field sm:col-span-2">Title<input name="title" required maxLength={100} defaultValue={editing.title}/></label><label className="photo-field sm:col-span-2">Description<textarea name="description" rows={3} maxLength={600} defaultValue={editing.description}/></label><label className="photo-field">Status<select name="status" defaultValue={editing.status}>{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label><label className="photo-field">Captured at<input name="capturedAt" type="datetime-local" defaultValue={toDateInput(editing.capturedAt)}/></label><label className="photo-field">Latitude<input name="latitude" type="number" min="-90" max="90" step="any" defaultValue={editing.location.latitude ?? ''}/></label><label className="photo-field">Longitude<input name="longitude" type="number" min="-180" max="180" step="any" defaultValue={editing.location.longitude ?? ''}/></label><label className="photo-field">Location source<select name="locationSource" defaultValue={editing.location.source}><option value="exif">Photo EXIF</option><option value="device">Device GPS</option><option value="manual">Manual entry</option><option value="unavailable">Unavailable</option></select></label><label className="photo-field">Location name<input name="locationLabel" maxLength={120} defaultValue={editing.location.label}/></label>
    </div><div className="flex justify-end gap-3 border-t border-slate-800 p-4"><button type="button" onClick={() => setEditing(null)} className="secondary-cta">Cancel</button><button disabled={isSubmitting} className="primary-cta">{isSubmitting ? <LoaderCircle className="animate-spin"/> : <Pencil/>}Save changes</button></div></form></div>}

    {selectedIllustration && createPortal(<div className="fixed inset-0 z-[75] grid place-items-center overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-md" onMouseDown={event => { if (event.currentTarget === event.target) setSelectedIllustration(null); }}><article className="my-6 w-full max-w-5xl overflow-hidden rounded-[28px] border border-cyan-300/20 bg-slate-900 shadow-2xl shadow-cyan-950/30">
      <div className="grid lg:grid-cols-[1.25fr_.75fr]">
        <div className="relative min-h-[330px] overflow-hidden bg-slate-950 lg:min-h-[620px]"><img src={selectedIllustration.image.imageUrl} alt={selectedIllustration.image.alt} className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" onError={event => { if (event.currentTarget.src !== illustrativeFallbackUrl) event.currentTarget.src = illustrativeFallbackUrl; }}/><div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20"/><span className="absolute bottom-5 left-5 rounded-full border border-white/20 bg-slate-950/60 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">Illustrative web image · not evidence</span></div>
        <div className="flex flex-col p-6 md:p-8"><div className="flex items-start justify-between gap-4"><div><p className="eyebrow">Participant visual context</p><h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-white">{selectedIllustration.participantLabel}</h2><p className="mt-1 text-xs text-slate-500">PDF row {selectedIllustration.rowNumber}</p></div><button type="button" onClick={() => setSelectedIllustration(null)} className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white" aria-label="Close illustration"><X className="h-5 w-5"/></button></div>
          <div className="mt-8 space-y-3"><div className="rounded-2xl border border-rose-400/15 bg-rose-400/[.07] p-4"><span className="text-[9px] font-bold uppercase tracking-wider text-rose-300">Q14 · observed problem</span><strong className="mt-2 block text-base text-white">{selectedIllustration.problem}</strong></div><div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[.07] p-4"><span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">Q15 · preferred action</span><strong className="mt-2 block text-base text-white">{selectedIllustration.preferredAction}</strong></div></div>
          <div className="mt-6"><p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300">Visual theme</p><h3 className="mt-2 text-lg font-bold text-white">{selectedIllustration.image.title}</h3><p className="mt-2 text-xs leading-5 text-slate-400">Selected automatically from the participant’s Q14/Q15 answers for presentation context only. It carries no participant authorship, GPS claim, or evidentiary status.</p></div>
          <div className="mt-auto pt-8"><a href={selectedIllustration.image.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4 transition hover:border-cyan-300/30"><span><small className="block text-[8px] font-bold uppercase tracking-wider text-slate-500">Image credit · {selectedIllustration.image.license}</small><strong className="mt-1 block text-xs text-cyan-200">{selectedIllustration.image.credit}</strong></span><ExternalLink className="h-4 w-4 text-cyan-300"/></a></div>
        </div>
      </div>
    </article></div>, document.body)}
  </div>;
};
