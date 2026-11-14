# PaintKing ERP Portal (`src/portal`)

## Overview
Root entry point and subsystem container for the PaintKing Internal ERP Portal, providing authentication gating, error boundary recovery, and tab-based navigation across all plant operations, quality assurance, stores, billing, and HR modules.

## Interface
- `PortalApp.tsx:PortalApp` — Root portal component (`onBackToWebsite: () => void`).
- `components`: [./components/README.md](./components/README.md) — Reusable UI components, modals, wizards, and document renderers.
- `context`: [./context/README.md](./context/README.md) — Central React Context store (`PortalStoreContext`).
- `data`: [./data/README.md](./data/README.md) — Static seed datasets and MNC audit questions.
- `face-engine`: [./face-engine/README.md](./face-engine/README.md) — Pluggable facial detection, 512-D ArcFace embeddings, and CompreFace integration.
- `lib`: [./lib/README.md](./lib/README.md) — Supabase client initialization and remote state sync helpers.
- `modules`: [./modules/README.md](./modules/README.md) — Self-contained feature modules (HR & Biometric Attendance).
- `services`: [./services/README.md](./services/README.md) — Domain services for biometrics, geofencing, payroll, barcodes, and PDF/CSV exports.
- `types`: [./types/README.md](./types/README.md) — Shared TypeScript interfaces and domain types.
- `utils`: [./utils/README.md](./utils/README.md) — PDF header/footer standards, auth helpers, email dispatch, and stock engine.
- `views`: [./views/README.md](./views/README.md) — Top-level operational views.

## Invariants
- `[PortalApp.tsx:PortalApp]` Wraps the portal in `PortalProvider` and `PortalErrorBoundary`; enforces tab access via `canAccessPortalTab` and falls back to `getDefaultTabForUser`.

## Side Effects
- `[PortalApp.tsx:PortalErrorBoundary]` Logs caught module errors to `console.error` and can clear local portal cache via `clearLocalPortalCache`.

## Verification
- Run: `npm run lint && npm run build`
