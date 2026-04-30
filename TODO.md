# Authenticated Edit Mode Tasks

Implement user/session protection before enabling broad intake edits. Work these branches in order so mutation APIs are protected before the UI exposes edit controls.

## 1. Admin Session Auth

- Branch: `feature/admin-session-auth`
- Goal: add local account auth with admin-managed users.
- Store users and sessions in SQLite.
- Bootstrap the first admin from env when no admin exists.
- Add login/logout/session APIs.
- Add an admin dashboard for listing and creating users.
- Do not expose public registration.
- Require admin session for `POST /api/admin/users`.
- Add a create-user form with manual password input and a generate-password button.
- Show the created password once after successful creation.
- Acceptance: admin can log in, create users from the dashboard only, reload keeps session, logout clears session, and non-admin or logged-out requests cannot create users.

## 2. Protect Intake Mutations

- Branch: `feature/protect-intake-mutations`
- Goal: split human UI auth from machine ingestion auth.
- Keep `POST /api/intake` token-based for MCP/import ingestion.
- Require a valid admin session for human mutation endpoints.
- Add shared auth checks for future `PATCH`/delete routes.
- Acceptance: unauthenticated UI mutation requests fail, while authorized ingestion still works with `FFIT_INGEST_TOKEN`.

## 3. Intake Update API

- Branch: `feature/intake-update-api`
- Goal: add a full-row update endpoint for intake entries.
- Add `updateIntakeEntry(id, input)` in `src/lib/intake-db.ts`.
- Add `PATCH /api/intake` with validation and session protection.
- Return the updated row so the UI can refresh local state.
- Acceptance: an authenticated request can edit date, meal, food, quantity, unit, brand, calories, fat, carbs, protein, url, and notes.

## 4. Inline Edit Mode UI

- Branch: `feature/edit-mode-value-modification`
- Goal: add row-level edit mode in the intake table.
- Replace notes-only editing state with full-entry drafts.
- Render compact inputs for text/numeric fields and a textarea for notes.
- Show edit controls only for authenticated sessions.
- Update table state and totals after a successful save.
- Acceptance: a logged-in user can edit one row, save, cancel, and see totals update correctly.

## 5. Notes Endpoint Cleanup

- Branch: `feature/notes-endpoint-cleanup`
- Goal: retire or deprecate the notes-only update path after full edit mode is stable.
- Remove unused notes-only frontend state and handlers.
- Keep `/api/intake/notes` only if compatibility is still needed.
- Update docs to describe the final edit/auth flow.
- Acceptance: no dead notes-only UI code remains, and tests/checks pass.
