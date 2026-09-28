# Climora — PDF Survey Intelligence Platform

Climora converts the supplied `RESPONSES.pdf` into a privacy-safe, traceable dashboard for survey results, summaries, comparisons, impact interpretation, and practical recommendations. The website uses no live weather API, forecast, air-quality feed, map service, or external climate dataset.

## Included

- 51 anonymized survey records and 765 answer cells verified against page 1 of the PDF.
- Row-level traceability through Participant ID, PDF row, page number, and question ID.
- Searchable evidence explorer, response details, question analytics, comparisons, and clean CSV export.
- Survey-derived impact priorities and recommendations with clear source, calculated, and interpretation labels.
- Blank values preserved without imputation and personal fields excluded from public application data.
- Responsive animated interface with desktop and mobile navigation.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The command starts both the API and Vite frontend.

For a production build:

```bash
npm run build
npm start
```

Open `http://localhost:3001`.

## PDF extraction

The extraction script requires Python and `pdfplumber`:

```bash
python scripts/extract_pdf.py --write
```

It validates the structured survey answers against `RESPONSES.pdf` and regenerates the anonymized browser fallback at `public/data/survey_data.json`.

## Application endpoints

- `GET /api/health`
- `GET /api/survey`
- `GET /api/survey/records`
- `GET /api/survey/record/:id`
- `GET /api/export/csv`
- `GET /api/survey-impacts`

The impact endpoint is calculated only from the extracted PDF survey records. It does not call an external provider.
All legacy `/api/weather/*` routes are disabled in PDF-only mode and return HTTP 410 without contacting a provider.

## Evidence boundary

Survey answers represent participant perceptions and are not presented as measured climate trends, a statistically representative regional sample, causal proof, or official hazard probabilities. Calculated results and interpretation are labeled separately throughout the interface.
