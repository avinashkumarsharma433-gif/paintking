# Components

## Overview
Shared UI components for the PaintKing public website, providing global navigation, footer, page banners, interactive before/after surface comparison, and catalogue PDF download functionality.

## Interface
- `BeforeAfterSlider` (`[BeforeAfterSlider.tsx:BeforeAfterSlider]`): Interactive split-view image comparison slider.
- `DownloadCatalogue` (`[DownloadCatalogue.tsx:DownloadCatalogue]`): Button component triggering the PaintKing catalogue PDF download.
- `Footer` (`[Footer.tsx:Footer]`): Global site footer with plant locations, navigation links, and CTA banner.
- `Header` (`[Header.tsx:Header]`): Global navigation bar with utility strip, services dropdown, and mobile drawer.
- `PageBanner` (`[PageBanner.tsx:PageBanner]`): Editorial page header with breadcrumb navigation.

## Invariants
- `sliderPosition` is clamped to `[0, 100]` (`[BeforeAfterSlider.tsx:updatePosition]`).
- Pointer drag initiates only on primary button (`e.button === 0`) (`[BeforeAfterSlider.tsx:handlePointerDown]`).
- `mobileView` resets to `'main'` whenever `mobileOpen` is `false` (`[Header.tsx:useEffect]`).

## Side Effects
- Captures and releases pointer events on the slider container (`[BeforeAfterSlider.tsx:handlePointerDown]`, `[BeforeAfterSlider.tsx:handlePointerUp]`).
- Schedules an 800ms timeout, appends/clicks/removes an anchor element on `document.body` to download `/Paintking_Redesigned_Catalogue.pdf`, and logs failures via `console.error` (`[DownloadCatalogue.tsx:handleDownload]`).
- Scrolls `window` to top smoothly on navigation link and CTA button clicks (`[Footer.tsx:Footer]`).
- Attaches and removes a `'mousedown'` listener on `document` to close the services dropdown on outside clicks (`[Header.tsx:useEffect]`).

## Verification
- Run: `npm run lint && npm run build`
