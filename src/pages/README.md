# Pages

## Overview
Top-level public marketing and informational page components for the PaintKing Surface Solutions website. Each page is rendered via client-side routing and receives a `navigateTo` callback prop for route transitions.

## Interface
- `AboutUs` (`React.FC<AboutUsProps>`) — Company heritage, mission/vision, plant locations, and leadership executive cards (`[AboutUs.tsx:AboutUs]`)
- `Blog` (`React.FC<BlogProps>`) — Scientific articles feed and full-article reader view (`[Blog.tsx:Blog]`)
- `Careers` (`React.FC<CareersProps>`) — Talent culture, active vacancies list, and interactive job application modal (`[Careers.tsx:Careers]`)
- `ContactUs` (`React.FC<ContactUsProps>`) — Technical RFQ quote builder, direct contact cards, and embedded Google Maps nodes (`[ContactUs.tsx:ContactUs]`)
- `DigitalPrinting` (`React.FC<DigitalPrintingProps>`) — Direct UV flatbed digital printing overview and plotting pipeline (`[DigitalPrinting.tsx:DigitalPrinting]`)
- `Gallery` (`React.FC<GalleryProps>`) — Category-filtered specimen gallery with modal lightbox (`[Gallery.tsx:Gallery]`)
- `Home` (`React.FC<HomeProps>`) — Hero showcase, service previews, before/after comparison, finish swatches, stats counter, and client reviews (`[Home.tsx:Home]`)
- `Hydrographic` (`React.FC<HydrographicProps>`) — 3D water transfer dipping science and 11-step dipping protocol (`[Hydrographic.tsx:Hydrographic]`)
- `InjectionMolding` (`React.FC<InjectionMoldingProps>`) — Thermoplastic injection tooling/molding fleet and CAD-to-ejection pipeline (`[InjectionMolding.tsx:InjectionMolding]`)
- `OurServices` (`React.FC<OurServicesProps>`) — Finishing divisions breakdown, substrate compatibility matrix, finish profile swatches, and 5-step workflow (`[OurServices.tsx:OurServices]`)
- `SprayPainting` (`React.FC<SprayPaintingProps>`) — Clean-room spray painting overview, before/after comparison, QA adhesion protocol, and FAQ (`[SprayPainting.tsx:SprayPainting]`)

## Invariants
- `[ContactUs.tsx:handleSubmission]` `recaptchaChecked` must be `true` to proceed with form submission.

## Side Effects
- `[Blog.tsx:handleBackToFeed]`, `[Blog.tsx:handleReadPost]` Calls `window.scrollTo({ top: 0, behavior: 'smooth' })` on view transitions.
- `[Careers.tsx:handleFormSubmission]`, `[ContactUs.tsx:handleSubmission]` Schedules a `1200ms` `setTimeout` timer to reset form state and set the submitted flag.
- `[Home.tsx:_touchStartX]` Mutates global `window` property `_touchStartX` on touch start.
- `[Home.tsx:useEffect]`, `[OurServices.tsx:useEffect]` Sets and clears `setInterval` timers for stats counter, hero carousel, and finish profile auto-rotation.
- `[Home.tsx:navigateTo]`, `[OurServices.tsx:navigateTo]`, `[SprayPainting.tsx:navigateTo]` Invokes `navigateTo` callback prop to trigger client-side route changes.

## Verification
- Run: `npm run lint && npm run build`
