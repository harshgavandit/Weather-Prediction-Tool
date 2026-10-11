# Climora — PDF Survey Intelligence Platform

Climora converts the supplied `RESPONSES.pdf` into a privacy-safe, traceable dashboard for survey results, summaries, comparisons, impact interpretation, and practical recommendations. It also supports separately labeled geo-tagged field photos linked to the 51 anonymous participants. The website uses no live weather API, forecast, air-quality feed, automatic map service, or external climate dataset.

## Included

- 51 anonymized survey records and 765 answer cells verified against page 1 of the PDF.
- Row-level traceability through Participant ID, PDF row, page number, and question ID.
- Searchable evidence explorer, response details, question analytics, comparisons, and clean CSV export.
- Export just the visible survey records with **Download Filtered CSV**, or the full dataset with **Download All Records**. Filtered exports retain participant IDs, PDF row/page references, all 15 answer columns, and blank non-responses. Search and filter controls include accessible labels and announce the result count.
- Survey-derived impact priorities and recommendations with clear source, calculated, and interpretation labels.
- Blank values preserved without imputation and personal fields excluded from public application data.
- Responsive animated interface with desktop and mobile navigation.
- Admin-managed JPEG, PNG, and WebP field evidence with EXIF, device-GPS, or manual coordinate provenance.
- Persistent photo gallery, participant attachment view, filters, metadata editing, verification status, and protected deletion.

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

## Weather prediction and recommendations

Open **Weather advisor** in the sidebar or **Ask** in the mobile navigation. Ask a question, optionally supply weather conditions, and select **Get recommendation**. Examples are editable; Ctrl/Cmd + Enter also submits. The last eight answers remain available while switching tabs, and **Clear conversation** removes them. Reloading the app clears questions and conditions.

The advisor uses deterministic local rules, with no AI, API key, new dependency, or external data request. It supports outdoor activities, clothing, heat/humidity, rain/storms, cold, wind, UV, hydration, air quality, and general weather-related health questions. Question text can include Celsius/Fahrenheit temperatures, humidity, UV, and wind in km/h. Each answer records the conditions used; explicit conditions in a question take priority over form values.

Current conditions are **user supplied**, not sensor readings. Unknown values stay unknown. The old weather snapshot and survey answers are never used as current telemetry. Future forecasts and city-specific readings are unavailable without a current data source, so forecast questions receive honest limitations and conditional planning advice. Health responses offer general precautions, not diagnoses or prescriptions; urgent personal symptoms receive emergency guidance. Authoritative further-reading links appear when relevant and are opened only by the user.

Run the advisor regression suite with `npm run test:advisor`, or all application tests with `npm test`. Rule details and verification scope are documented in `docs/WEATHER_ADVISOR.md`.

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
- `GET /api/photo-evidence`
- `GET /api/photo-evidence/:id/image`
- `POST /api/photo-evidence`
- `PATCH /api/photo-evidence/:id`
- `DELETE /api/photo-evidence/:id`

The impact endpoint is calculated only from the extracted PDF survey records. It does not call an external provider.
All legacy `/api/weather/*` routes are disabled in PDF-only mode and return HTTP 410 without contacting a provider.

Photo mutations are available from localhost for the college demonstration. For a non-local deployment, set `CLIMORA_ADMIN_KEY` and enter the same value in the evidence manager; remote mutations without the key are rejected. Uploaded files are limited to 8 MB and validated by their actual JPEG, PNG, or WebP signature.

## Evidence boundary

Survey answers represent participant perceptions and are not presented as measured climate trends, a statistically representative regional sample, causal proof, or official hazard probabilities. Calculated results, interpretation, and newly attached field evidence are labeled separately throughout the interface. Photo coordinates are never treated as PDF data and are never invented.
