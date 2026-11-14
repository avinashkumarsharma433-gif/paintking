# Portal Utils (`src/portal/utils`)

## Overview
Shared utility modules for standardized PDF header/footer rendering, base64 logo assets, authentication helpers, email dispatch, and stock calculations.

## Interface
- `paintkingLogoBase64.ts:PAINTKING_LOGO_BASE64` — Base64 PNG data URI string for the PaintKing logo.
- `pdfStandardHeader.ts:TABLE_BORDER_COLOR` — Readonly RGB tuple `[180, 185, 195]` for PDF table borders.
- `pdfStandardHeader.ts:TABLE_LINE_WIDTH` — Constant `0.45` for PDF table line width.
- `pdfStandardHeader.ts:StandardPdfHeaderOptions` — TypeScript interface for PDF header options.
- `pdfStandardHeader.ts:drawStandardPdfHeader` — Draws standard PaintKing logo, company details, and divider on a `jsPDF` document, returning `Y=28`.
- `pdfStandardHeader.ts:drawStandardPdfFooter` — Draws standard footer divider, legal note, page counter, and timestamp on a `jsPDF` document.

## Invariants
- `[pdfStandardHeader.ts:drawStandardPdfHeader]` Draws logo at `(14, 7, 42, 14.5)` and divider rule at `y=25mm`, returning safe starting `Y=28`.
- `[pdfStandardHeader.ts:drawStandardPdfFooter]` Draws footer divider at `y=283mm` and formats default timestamp using `'en-IN'` locale.
- `[pdfStandardHeader.ts:TABLE_BORDER_COLOR]` Fixed at `[180, 185, 195]` with `TABLE_LINE_WIDTH` fixed at `0.45`.

## Side Effects
- `[pdfStandardHeader.ts:drawStandardPdfHeader]` Mutates the passed `jsPDF` instance and logs `console.warn` if `PAINTKING_LOGO_BASE64` fails to render.
- `[pdfStandardHeader.ts:drawStandardPdfFooter]` Mutates the passed `jsPDF` instance by drawing footer lines and text.

## Verification
- Run: `npm run lint && npm run build`
