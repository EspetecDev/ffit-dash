# Ffit Dash

Next.js dashboard for a personal fitness log.

Runtime note: the API uses Node's built-in `node:sqlite` module, so the deployed Node runtime or Docker image must include that module.

## Data Source

The app stores intake data in a local SQLite database. For self-hosting, set:

```bash
FFIT_DATA_DIR=/data/ffit
FFIT_INGEST_TOKEN=change-me
```

The app will create and update:

```txt
/data/ffit/ffit.db
```

If `FFIT_DATA_DIR` is not set, it uses:

```txt
data/ffit.db
```

The dashboard reads entries through `GET /api/intake`. Note edits use `POST /api/intake/notes` and update SQLite directly.

New entries can be written through `POST /api/intake` with:

```http
Authorization: Bearer $FFIT_INGEST_TOKEN
Content-Type: application/json
```

Expected JSON fields:

```json
{
  "date": "2026-04-28",
  "meal": "Lunch",
  "food": "Chicken rice",
  "quantity": "1",
  "unit": "plate",
  "brand": "",
  "calories": 650,
  "fat": 18,
  "carbs": 78,
  "protein": 42,
  "url": "",
  "notes": ""
}
```

For Docker, mount a persistent host folder to the configured data directory:

```bash
docker run -p 3000:3000 \
  -e FFIT_DATA_DIR=/data/ffit \
  -e FFIT_INGEST_TOKEN=change-me \
  -v ~/ffit-data:/data/ffit \
  ffit-dash
```

## Local Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```
