# AGENTS.MD - PaintKing Surface Solutions Architecture & UI/UX Design System

> **Project Name:** PaintKing Website Management  
> **Brand Entity:** PaintKing Surface Solutions ()  
> **Live Architecture:** Vite + React (TypeScript) + Tailwind CSS v4 + Motion React + Lucide Icons  
> **Last Updated:** August 2026  

---

## 1. Executive Summary & Brand Identity

PaintKing is India's premier B2B custom surface finishing, liquid spray painting, hydrographic 3D immersion dipping, industrial flatbed direct UV printing, and custom thermoplastic injection moulding enterprise.

The website is engineered with an **Editorial Industrial Luxury** aesthetic—combining clean Swiss precision, spacious editorial typography (Newsreader / Source Serif 4 paired with Plus Jakarta Sans), champagne and fog paper surfaces, and the **signature PaintKing Gold (#c09748)**.

---

## 2. UI/UX Design Intelligence & Principles

The website design adheres to the **UI/UX Designer Intelligence System**, prioritizing Accessibility (Priority 1), Touch & Interaction (Priority 2), Performance (Priority 3), and Responsive Layout Integrity (Priority 4).

### Core Design Rules
1. **No Emojis for Industrial Icons**: Always use semantic SVG vector icons from lucide-react (never system emojis).
2. **Standardized Radii Hierarchy**:
   - **Page Content Cards / Hero Containers**: ounded-[24px] (24px radius).
   - **Floating Product Artifacts / Media Frames**: ounded-[20px] (20px radius).
   - **Modals & Dialogs**: ounded-[24px] (24px radius).
   - **Form Inputs & Interactive Fields**: ounded-[16px] (16px radius).
   - **Buttons, Badges & Breadcrumbs**: ounded-full / 9999px pill architecture.
3. **Micro-Interactions**: Smooth 150ms–300ms transition curves (cubic-bezier(0.16, 1, 0.3, 1)).
4. **Color Contrast & A11y**:
   - Primary dark body text: #17191c (7:1 contrast on white #ffffff).
   - Secondary / muted text: #777b86 (4.8:1 contrast on white, exceeding WCAG AA minimum 4.5:1).
   - Accessible keyboard focus rings: :focus-visible { outline: 2px solid #c09748; outline-offset: 2px; }.
   - Motion accessibility: @media (prefers-reduced-motion: reduce) respected globally.
5. **Cursor Pointer Rule**: Explicit cursor-pointer on all interactive buttons, cards, filter swatches, and links.

---

## 3. Design Tokens & Color Palette

### Primary Color System
| Token Name | Hex Code | Purpose / Usage |
|---|---|---|
| --color-ink | #17191c | Primary deep charcoal/black for text, dark capsules & buttons |
| --color-paper | #ffffff | Primary bright background paper |
| --color-fog | #fafafb | Soft secondary surface / section backgrounds |
| --color-mist | #f2f2f3 | Neutral border and chip tint |
| --color-slate | #777b86 | Secondary body text & paragraph descriptions |
| --color-ash | #979799 | Tertiary metadata & captions |
| --color-smoke | #a3a6af | Subtle divider lines & inactive indicators |

### PaintKing Brand Gold Accent System
| Token | Hex Code | Visual Application |
|---|---|---|
| --color-accent-50 | #faf7ed | Ultra-light subtle card glow |
| --color-accent-100 | #faf3e0 | Champagne tint surface for badges, checkmarks & highlights |
| --color-accent-200 | #f4e5be | Champagne border borders |
| --color-accent-500 | #c09748 | **Official PaintKing Brand Accent Gold** (Buttons, active tabs, highlights) |
| --color-accent-600 | #a97e35 | Gold button hover state |
| --color-accent-700 | #8a6521 | Deep gold text on champagne backgrounds for high contrast |

---

## 4. Typography Scale & Hierarchy

- **Display & Headings (ont-serif)**: Newsreader, Source Serif 4, Georgia, serif.
  - Normal font weight (ont-normal or 400), tight tracking (	racking-tight), sentence case.
  - H1 Display: 	ext-4xl sm:text-6xl font-serif
  - H2 Section Title: 	ext-3xl sm:text-5xl font-serif
  - H3 Card Title: 	ext-lg sm:text-xl font-serif
- **Body & UI Elements (ont-sans)**: Plus Jakarta Sans, system sans-serif.
  - Body Paragraph: 	ext-[15px] or 	ext-sm, 	ext-[#777b86], leading-relaxed.
  - Uppercase Section Eyebrow: 	ext-[11px] font-semibold uppercase tracking-[0.2em] text-[#c09748].
  - Pill Action Text: 	ext-xs sm:text-sm font-medium.

---

## 5. Component Architecture & UI Standards

### Global Header (src/components/Header.tsx)
- **Top Bar**: Editorial utility strip displaying phone (+91 9594591313), email (info@paintking.in), operating hours, and active **** certification badge.
- **Main Nav Capsule**: Floating max-w-6xl pill navigation capsule with blur backdrop (ackdrop-blur-xl), seamless service dropdown menus, and instant RFQ action.

### Global Footer (src/components/Footer.tsx)
- Multi-plant operational footprint breakdown (Vapi, Mumbai, Haridwar, Vasai).
- Champagne CTA banner with fast hotline links.
- Verified company registration details & quick navigation links.

### Page Banner (src/components/PageBanner.tsx)
- Serif display headers with gold pill breadcrumb navigation.
- Subtle fog background #fafafb with micro-border separation.

### Interactive Before/After Slider (src/components/BeforeAfterSlider.tsx)
- High-precision split comparison dragger showing raw substrate vs. finished coated component.
- 24px container with smooth dragging physics and gold handle.

### PDF Brochure Generator (src/components/DownloadCatalogue.tsx)
- Client-side printable PDF summary with ISO certification stamps, service lists, and specimen data.

---

## 6. Page Registry & Functional Routes

Routing is managed via client-side active page state in src/App.tsx:

1. **home (src/pages/Home.tsx)**:
   - 12-slide hero showcase with video/photography.
   - 4 service division preview cards with 24px radius.
   - Interactive Before/After comparison component.
   - 14 surface finish profile swatches with interactive category tabs.
   - Manufacturing heritage stats counter (30+ years, 50,000+ daily parts).
   - OEM Client trust badge cloud.
   - Client reviews & dark editorial RFQ capsule.
2. **services (src/pages/OurServices.tsx)**:
   - In-depth capability breakdown of all 4 finishing divisions.
   - Substrate compatibility matrix (ABS, PC, Nylon, Aluminum, Steel, Brass).
   - 14 finish profile swatches with active preview inspect window.
   - 5-step industrial finishing workflow.
3. **spray-painting (src/pages/SprayPainting.tsx)**:
   - Dust-Free Clean Environment overview.
   - Direct Before/After comparison tool.
   - 6 commercial sector applications.
   - QA adhesion testing protocol (ASTM 5B cross-hatch, gloss meter, salt spray).
   - Technical FAQ accordion.
4. **hydrographic (src/pages/Hydrographic.tsx)**:
   - 3D water transfer dipping science and PVA film immersion physics.
   - 6 key manufacturing advantages.
   - 11-step hydrographic dipping protocol vertical milestone timeline.
5. **digital (src/pages/DigitalPrinting.tsx)**:
   - Direct UV flatbed digital printing overview.
   - 4 commercial advantages (instant LED UV curing, zero screen setup fees, 1440 DPI).
   - 5-step UV plotting pipeline.
6. **injection-molding (src/pages/InjectionMolding.tsx)**:
   - Precision thermoplastic injection tooling and molding fleet (80T to 450T).
   - Turnkey one-roof benefits (no transit scuffs, zero vendor sprawl).
   - 5-step CAD to ejection pipeline.
7. **gallery (src/pages/Gallery.tsx)**:
   - Category filtering (All, Spray, Hydrographic, Digital, Injection Moulding).
   - 24px specimen gallery cards with dark hover revelation.
   - High-resolution modal lightbox with sample slab request CTA.
8. **bout (src/pages/AboutUs.tsx)**:
   - 30-year industrial heritage and founding vision.
   - Mission and Vision statements.
   - 4 plant location nodes.
   - Leadership executive cards for Kuldeep Singh & Gurprit Singh.
9. **contact (src/pages/ContactUs.tsx)**:
   - Technical RFQ quote builder with division selector.
   - Direct hotline and email cards.
   - 2 Embedded interactive Google Maps nodes (Mumbai Head Office & Haridwar Unit).
10. **log (src/pages/Blog.tsx)**:
    - Scientific articles on Delta-E colorimetry, ASTM adhesion, and surface coatings.
    - Full-article reader view with author credentials.
11. **careers (src/pages/Careers.tsx)**:
    - Talent culture & employee benefits.
    - Active operator/chemist vacancies list.
    - Interactive job application dialog modal.

---

## 7. Developer & Agent Guidelines

When maintaining or adding features to this codebase:
- **Build Command**: `npm run build`
- **Development Server**: `npm run dev` (http://localhost:3000/)
- **Motion React**: Always import from `motion/react` (e.g. `import { motion, AnimatePresence } from 'motion/react';`).
- **Tailwind Version**: Tailwind CSS v4 using `@theme` block in `src/index.css`.
- **Preserve Colors**: Keep `#c09748` as primary gold and `#17191c` as primary charcoal.

### 8. Standard Portal UI/UX & Component Architecture (Crucial Rules)

1. **Button Language (No Pitch Black `#000000`)**:
   - Primary buttons: `bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold rounded-full shadow-2xs transition cursor-pointer flex items-center gap-1.5 active:scale-95`.
   - Never use solid pitch black buttons.
2. **List View Architecture (4-Column Rule & No Cognitive Anxiety)**:
   - Desktop tables display only 4-5 core summary columns (`Ref & Date`, `Party/Supplier`, `Material & Qty`, `Status`, `Action`).
   - Action column includes `View Details` modal trigger button and `PDF` download button.
   - Mobile screens (`<640px`) hide table and render clean 3-row responsive cards (`bg-[#fafafb] rounded-[18px] border border-[#ececec] p-3.5`).
3. **Form Architecture & Stepper**:
   - Multi-step wizards use connected pill steppers.
   - Date inputs MUST use `<PaintkingDatePicker value={...} onChange={...} placeholder="DD-MM-YYYY" />`.
   - Dynamic item lists MUST have `p-1` safe container padding to avoid focus ring clipping and have an explicit 12th column for delete trash button (`sm:col-span-1`).
4. **Official PDF Generation & Table Architecture (Universal Standard)**:
   - Standard PDF generator in `src/portal/utils/pdfStandardHeader.ts` with PaintKing logo header, 3-row metadata grid (`drawMetaField`), ISO certified footer, and Indian timestamp.
   - **MANDATORY TABLE STYLING RULE (Strict Across ALL PDFs)**:
     - **Table Header Background**: Light grey `doc.setFillColor(242, 242, 243);` (Never use dark/black `#17191c` or `#000000`).
     - **Table Header Text**: Bold deep charcoal `doc.setTextColor(23, 25, 28);` (font-size 7.0–7.5pt).
     - **Table Border Color & Line Width**: `TABLE_BORDER_COLOR = [180, 185, 195]` and `TABLE_LINE_WIDTH = 0.45` applied uniformly across all outer boundaries, header borders, alternating row lines, and inner vertical column dividers.
     - **Zebra Striping**: Alternating white (`255, 255, 255`) and soft tint (`235, 238, 244` / `250, 250, 251`).
     - **Total / Summary Row**: Light grey `242, 242, 243` or solid summary bar `215, 220, 228` with bold charcoal text.

