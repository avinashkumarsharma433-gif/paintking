# admin-users

## Overview
Supabase Edge Function (Deno) providing Super Admin user lifecycle management (`create_user`, `update_user`, `delete_user`) across Supabase Auth and the `pk_portal_users` table.

## Interface
- `index.ts:AdminRequestPayload` - Request payload interface (`action: 'create_user' | 'update_user' | 'delete_user'`, `userId?`, `email?`, `password?`, `fullName?`, `role?`, `roleTitle?`, `plant?`, `allowedModules?`, `isActive?`).
- `index.ts:Deno.serve` - HTTP handler supporting `OPTIONS` (CORS preflight) and `POST` JSON requests.

## Invariants
- Caller must provide a valid `Authorization: Bearer <token>` header that resolves to an authenticated user (`userClient.auth.getUser()`).
- Caller must have an active `SUPER_ADMIN` profile (`role === 'SUPER_ADMIN'` and `is_active === true`) in `pk_portal_users`.
- `create_user`: `email` must end with `@paintking.in`, `password` length must be `>= 8`, and `fullName` is required.
- `update_user`: `userId` is required; cannot deactivate own Super Admin account (`targetId === callerProfile.id && body.isActive === false`); if `password` is provided, its trimmed length must be `>= 8`.
- `delete_user`: `userId` is required; cannot delete own Super Admin account (`targetId === callerProfile.id`).

## Side Effects
- Reads environment variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_ANON_KEY`.
- `create_user`: Creates a confirmed user in Supabase Auth (`adminClient.auth.admin.createUser`) and upserts a row in `pk_portal_users`; rolls back the Auth user via `deleteUser` if the profile upsert fails.
- `update_user`: Optionally updates the Auth user password (`adminClient.auth.admin.updateUserById`) and updates `pk_portal_users`.
- `delete_user`: Deletes the user from Supabase Auth (`adminClient.auth.admin.deleteUser`).

## Verification
- Run: `npm run lint && npm run build`
