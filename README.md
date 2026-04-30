# Supabase CRUD Data Layer

This app uses Supabase Auth for email/password sessions and a reusable multi-table CRUD layer for authenticated users.

## Secure connection URI setup

Do not paste database passwords into source files. Store the Postgres connection URI as a managed runtime secret named:

```txt
EXTERNAL_SUPABASE_DATABASE_URL
```

In Lovable, use **Secrets** to add/update that value. The frontend never receives this URI; it calls a backend function that reads it securely at runtime.

Optional write allowlist for non-user-scoped tables:

```txt
EXTERNAL_SUPABASE_MUTABLE_TABLES=tours,products
```

Tables with a `user_id` column are automatically treated as user-scoped and writable only for the signed-in user's rows.

## Environment variables

Client-side Supabase values are managed by Lovable Cloud and exposed as:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID
```

Do not hardcode service-role keys, database URLs, or passwords in React code.

## Data layer

- `src/services/db.ts` exposes `getSchema`, `getAll`, `getById`, `createRecord`, `updateRecord`, `deleteRecord`, plus condition-based helpers.
- `supabase/functions/db-api/index.ts` performs schema introspection, pagination, sorting, filtering, search, safe mutations, and relationship metadata handling.
- `src/components/DynamicCrudManager.tsx` provides the authenticated multi-table UI with schema display, search, pagination, add/edit/delete forms, validation, loading states, empty states, and error toasts.

## Run locally

```sh
bun install
bun run dev
```

## Test and build

```sh
bun run test
bun run build
```
