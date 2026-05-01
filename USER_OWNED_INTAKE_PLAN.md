# User-Owned Intake Data Plan

Goal: let each dashboard user log in, see only their own intake data, and modify their own rows. Admin permissions stay focused on account creation and management.

## Commit Steps

1. Add intake ownership storage - Done
   - Add `user_id` to `intake_entries`.
   - Migrate existing rows to the configured ingest user.
   - Keep database initialization deterministic for local and Docker deployments.

2. Scope intake APIs to sessions - Done
   - Require a session for dashboard `GET /api/intake`.
   - Restrict `PATCH /api/intake` to rows owned by the current user.
   - Keep MCP/import ingestion separate from human dashboard auth.

3. Decide and implement MCP ownership - Done
   - Start with a default ingest owner so token ingestion remains usable.
   - Document the owner selection rule.

4. Update dashboard login behavior - Done
   - Require login before showing intake data.
   - Let `user` accounts create and edit their own rows.
   - Keep account creation restricted to admins.

5. Add validation and docs - Done
   - Cover owner scoping with API smoke tests or focused automated tests.
   - Update README with the final auth and ownership model.

## Manual Test Checklist

1. Start the app with `FFIT_ADMIN_USERNAME`, `FFIT_ADMIN_PASSWORD`, and `FFIT_INGEST_USERNAME` when existing rows need migration.
2. Open `/` while logged out and confirm the intake dashboard asks for login.
3. Log in as admin on `/` and confirm the dashboard sends the admin to `/admin` instead of showing intake data.
4. Open `/admin`, create a normal `user` account, and confirm account creation is admin-only.
5. Use the normal user's API token to upload an intake row through `POST /api/intake` or MCP.
6. Log in as the normal user on `/`, confirm the uploaded row appears, and edit it.
7. Log out and confirm `/api/intake` returns `401` without a session.
