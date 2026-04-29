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

## Docker

The included `Dockerfile` builds a production Next.js image with standalone output. The included `docker-compose.yml` runs that image and stores SQLite data in a persistent Docker volume.

1. Make sure Docker is running.

2. Choose an ingest token. This token is required when creating new intake entries through `POST /api/intake`.

```bash
export FFIT_INGEST_TOKEN=change-me
```

3. Build and start the app with Docker Compose.

```bash
docker compose up --build
```

4. Open the dashboard.

```txt
http://localhost:3000
```

5. Check that the API can read the SQLite database.

```bash
curl http://localhost:3000/api/intake
```

The Compose setup maps:

```txt
3000:3000
ffit-data:/data/ffit
```

The app will create and update:

```txt
/data/ffit/ffit.db
```

To stop the app while keeping the SQLite data volume:

```bash
docker compose down
```

To remove the app and its persisted SQLite volume:

```bash
docker compose down --volumes
```

You can also build and run the image manually with a host-mounted data directory:

```bash
docker build -t ffit-dash .

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
