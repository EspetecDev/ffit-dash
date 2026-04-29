# Authenticated Edit Mode Tasks

Implement user/session protection before enabling broad intake edits. Work these branches in order so mutation APIs are protected before the UI exposes edit controls.

## 1. Admin Session Auth

- Branch: `feature/admin-session-auth`
- Goal: add a minimal admin login and signed session cookie.
- Add environment-backed credentials for a single admin user.
- Add login/logout API routes and a small login screen or gate.
- Add a server-side helper to read and validate the session.
- Acceptance: a browser session can log in, persist across reloads, and log out.

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
