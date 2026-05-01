# User-Owned Intake Data Plan

Goal: let each dashboard user log in, see only their own intake data, and modify their own rows. Admin permissions stay focused on account creation and management.

## Commit Steps

1. Add intake ownership storage - Done
   - Add `user_id` to `intake_entries`.
   - Migrate existing rows to the first admin user.
   - Keep database initialization deterministic for local and Docker deployments.

2. Scope intake APIs to sessions - Done
   - Require a session for dashboard `GET /api/intake`.
   - Restrict `PATCH /api/intake` to rows owned by the current user.
   - Keep MCP/import ingestion separate from human dashboard auth.

3. Decide and implement MCP ownership
   - Start with a default ingest owner so token ingestion remains usable.
   - Document the owner selection rule.

4. Update dashboard login behavior
   - Require login before showing intake data.
   - Let both `admin` and `user` accounts create and edit their own rows.
   - Keep account creation restricted to admins.

5. Add validation and docs
   - Cover owner scoping with API smoke tests or focused automated tests.
   - Update README with the final auth and ownership model.
