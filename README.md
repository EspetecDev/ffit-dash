# Ffit Dash

Next.js dashboard for a personal fitness log.

Runtime note: the API uses Node's built-in `node:sqlite` module, so the deployed Node runtime or Docker image must include that module.

## Data Source

The app stores intake data in a local SQLite database. For self-hosting, set:

```bash
FFIT_DATA_DIR=/data/ffit
FFIT_INGEST_TOKEN=change-me
FFIT_INGEST_USERNAME=demo-user
```

The app will create and update:

```txt
/data/ffit/ffit.db
```

If `FFIT_DATA_DIR` is not set, it uses:

```txt
data/ffit.db
```

The dashboard requires login before reading intake data. `GET /api/intake` returns only the current user's entries. Normal `user` accounts can edit their own rows through `PATCH /api/intake`. Admin accounts are reserved for account management in `/admin`.

New entries can be written through `POST /api/intake` with:

```http
Authorization: Bearer $FFIT_INGEST_TOKEN
Content-Type: application/json
```

Token ingestion writes rows to `FFIT_INGEST_USERNAME`. The username must already exist and must have the `user` role. Admin accounts cannot own intake rows.

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
export FFIT_INGEST_USERNAME=demo-user
export FFIT_ADMIN_USERNAME=admin
export FFIT_ADMIN_PASSWORD=change-me-admin-password
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
  -e FFIT_INGEST_USERNAME=demo-user \
  -e FFIT_ADMIN_USERNAME=admin \
  -e FFIT_ADMIN_PASSWORD=change-me-admin-password \
  -v ~/ffit-data:/data/ffit \
  ffit-dash
```

## MCP Intake Upload

The app includes an MCP stdio server so AI clients that support Model Context Protocol can upload intake data through the app API.

Run it locally with:

```bash
FFIT_API_BASE_URL=http://localhost:3000 \
FFIT_INGEST_TOKEN=change-me \
npm run mcp:intake
```

Set `FFIT_API_BASE_URL` to the running dashboard URL. For example, if Docker Compose exposes the app on `5959:3000`, use `http://localhost:5959`.

Example MCP client configuration:

```json
{
  "mcpServers": {
    "ffit-dash-intake": {
      "command": "npm",
      "args": ["run", "mcp:intake", "--"],
      "cwd": "/path/to/ffit-dash",
      "env": {
        "FFIT_API_BASE_URL": "http://localhost:3000",
        "FFIT_INGEST_TOKEN": "change-me"
      }
    }
  }
}
```

Available tools:

- `upload_intake_entry`: creates one intake row.
- `upload_intake_entries`: creates up to 100 intake rows in one call.

Both tools accept `date`, `meal`, `food`, `quantity`, `unit`, `brand`, `calories`, `fat`, `carbs`, `protein`, `url`, and `notes`. `date` must use `YYYY-MM-DD`.

MCP uploads use the same token ingestion owner rule as `POST /api/intake`: set `FFIT_INGEST_USERNAME` on the running dashboard service to choose which user account receives uploaded rows.

## Admin Accounts

Open the admin dashboard at:

```txt
http://localhost:3000/admin
```

The first admin account is bootstrapped from environment variables when no admin user exists:

```bash
FFIT_ADMIN_USERNAME=admin
FFIT_ADMIN_PASSWORD=change-me-admin-password
```

After logging in, admins can list users and create new `user` or `admin` accounts. Public registration is not available; `POST /api/admin/users` requires an authenticated admin session. Passwords are hashed before storage, and generated or manually entered passwords are only shown once after user creation.

Only `user` accounts can use the main intake dashboard. Each user sees and edits only their own intake entries. Admin role is only for account management.

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
