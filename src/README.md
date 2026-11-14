# src

> Frontend application root for the PaintKing Public Website and Operations OS (`PK-OS`) Portal.

## Subdirectories

| Directory | Summary | Contract |
|---|---|---|
| `components` | Shared public website UI components (Header, Footer, PageBanner, BeforeAfterSlider, DownloadCatalogue). | [README.md](./components/README.md) |
| `pages` | Public marketing and service division pages (Home, OurServices, SprayPainting, Hydrographic, DigitalPrinting, InjectionMolding, Gallery, AboutUs, ContactUs, Blog, Careers). | [README.md](./pages/README.md) |
| `portal` | PaintKing Internal ERP Portal (`PK-OS`) with stores, job cards, QA, billing, packing, and HR biometric attendance. | [README.md](./portal/README.md) |

## Local Interface & Invariants

- **Entry & Routing**: `[main.tsx:createRoot]` mounts `[App.tsx:App]`, which manages client-side page state (`PageId`) and switches between the public website and `[portal/PortalApp.tsx:PortalApp]`.
- **Shared Types & Data**: `[types.ts]`, `[constants.ts]`, `[data.ts]`, `[cloudinary_manifest.json]`.
- **Invariants**: None beyond child module contracts.
- **Side Effects**: `[main.tsx]` mounts React DOM root onto `#root`.

## Verification

```bash
npm run lint && npm run build
```
