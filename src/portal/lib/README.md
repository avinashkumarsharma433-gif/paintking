# Portal Lib (`src/portal/lib`)

## Overview
Supabase client initialization, remote state synchronization helpers, and Edge Function invocation wrappers.

## Interface
- `supabaseClient.ts:supabase`
- `supabaseClient.ts:fetchRemoteState`
- `supabaseClient.ts:fetchAllRemoteState`
- `supabaseClient.ts:persistRemoteState`
- `supabaseClient.ts:fetchMyPortalProfile`
- `supabaseClient.ts:fetchAllPortalUsers`
- `supabaseClient.ts:AdminUserMutationPayload`
- `supabaseClient.ts:invokeAdminUsersFunction`

## Invariants
- `[supabaseClient.ts:supabaseUrl]` Falls back to hardcoded Supabase URL when `import.meta.env.VITE_SUPABASE_URL` is unset.
- `[supabaseClient.ts:supabaseAnonKey]` Falls back to hardcoded publishable anon key when `import.meta.env.VITE_SUPABASE_ANON_KEY` is unset.
- `[supabaseClient.ts:fetchRemoteState]` Never throws; returns `localFallback` on Supabase error or network exception.
- `[supabaseClient.ts:fetchAllRemoteState]` Never throws; returns `null` on Supabase error or network exception.
- `[supabaseClient.ts:persistRemoteState]` Defaults `updated_by` to `'factory-terminal'` when `updatedBy` is omitted.
- `[supabaseClient.ts:fetchMyPortalProfile]` Returns error message if no row exists in `pk_portal_users` for `userId`.
- `[supabaseClient.ts:invokeAdminUsersFunction]` Flags `edgeFunctionMissing` when error message contains `'Failed to send a request'`, `'404'`, `'NOT_FOUND'`, `'Failed to fetch'`, or `'Failed to send'`.

## Side Effects
- `[supabaseClient.ts:supabase]` Initializes Supabase client with `auth.persistSession=true`, `auth.autoRefreshToken=true`, and `realtime.params.eventsPerSecond=10`.
- `[supabaseClient.ts:fetchRemoteState]`, `[supabaseClient.ts:fetchAllRemoteState]` Query Supabase table `'pk_portal_state'` and log `console.warn` on error/exception.
- `[supabaseClient.ts:persistRemoteState]` Upserts row into Supabase table `'pk_portal_state'` with `updated_at` ISO timestamp and logs `console.warn` on error/exception.
- `[supabaseClient.ts:fetchMyPortalProfile]`, `[supabaseClient.ts:fetchAllPortalUsers]` Query Supabase table `'pk_portal_users'`.
- `[supabaseClient.ts:invokeAdminUsersFunction]` Invokes Supabase Edge Function `'admin-users'` with `AdminUserMutationPayload`.

## Verification
- Run: `npm run lint && npm run build`
