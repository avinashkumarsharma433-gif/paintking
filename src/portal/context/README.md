# Portal Context (`src/portal/context`)

## Overview
Central React Context store (`PortalStoreContext`) managing global state, plant filtering, and remote persistence for the PaintKing Portal.

## Interface
- `PortalStoreContext.tsx:PortalProvider` — React context provider wrapping the portal application.
- `PortalStoreContext.tsx:usePortalStore` — Hook to access portal state and dispatchers.

## Invariants
- `[PortalStoreContext.tsx:usePortalStore]` Throws `Error('usePortalStore must be used within a PortalProvider')` when used outside `PortalProvider`.

## Side Effects
- `[PortalStoreContext.tsx:persistRemoteState]` Persists portal state changes to Supabase (imported from `../lib/supabaseClient`).
- `[PortalStoreContext.tsx:fetchAllRemoteState]` Fetches all persisted portal state keys from Supabase on load (imported from `../lib/supabaseClient`).

## Verification
- Run: `npm run lint && npm run build`
