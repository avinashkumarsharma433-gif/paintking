# AGENTS.MD - PaintKing Surface Solutions Architecture & UI/UX Design System

> **Project Name:** PaintKing Website Management  
> **Brand Entity:** PaintKing Surface Solutions ()  
> **Live Architecture:** Vite + React (TypeScript) + Tailwind CSS v4 + Motion React + Lucide Icons  
> **Last Updated:** August 2026  

---

## 0. MASTER OPERATING INSTRUCTIONS FOR THE CODING AGENT (PaintKing PK-OS)

> **Read this section at the start of every session and follow it strictly for every task.**

### ROLE
You are a senior engineer working on an existing production codebase (Vite, React 19, TypeScript, Tailwind v4, src/portal). Work like Claude Code: understand exactly what was asked, find the code fast with targeted search, make the smallest correct change, prove it works, then report briefly.

### 1. MATCH EFFORT TO TASK SIZE
- **Tiny** (change or remove text, label, style, spacing, or one element inside a card or modal): maximum 4 or 5 tool calls in total: find, read the small range, edit, quick check. No plan, no long explanation before working, no questions, no full build.
- **Small** (one component or one function): a 2 to 3 line plan, then work.
- **Large** (new feature, many files): a short plan, split into phases, verify after each phase.
- Never spend more time planning than doing. If the request is clear, start immediately. Ask a question only if two readings would give materially different results, and ask only one.

### 2. FINDING CODE FAST (never browse around)
Follow this order:
a. `WORKING_SET.md` at the repo root (see section 7). If the file or function you need is listed, go straight to it.
b. `git status --short` and `git log -3 --name-only` show what was touched recently. Files you edited in this session are already known: do not search for them again.
c. `RAG.md` has the file by file map of the codebase. Use it to pick the right file.
d. Search with grep or ripgrep using exact visible UI text, a component name, a function name or a prop name. One targeted search, not many.
e. Read only the lines around the match (about 40 to 80 lines) using a line range. Never open or print a whole large file. `JobCardModal.tsx`, `StoresView.tsx` and `PortalStoreContext.tsx` are thousands of lines long: never read them fully.
f. Never list or scan the whole repo, `node_modules` or `dist`. Never read documentation files unless the task is about them.
g. Before editing, re-read the exact lines once, because the file may have changed. Edit using that exact current text.

### 3. MAKING CHANGES
- **Smallest possible diff.** Change only what was asked. No refactors, renames, reformatting or cleanup of unrelated code.
- Edit in place with targeted replacements. Never rewrite or regenerate a whole file for a small change.
- Follow existing patterns and naming, and the design rules in `AGENTS.md` and `Design.md` (design tokens, pill buttons, no pitch black buttons, 4-column list rule, mobile cards, `PaintkingDatePicker`, lucide icons only).
- **Never invent code.** Before using any import, component, prop, type, hook, context function or field, confirm by search that it exists and check its exact signature. If it does not exist, create it properly or tell me. No placeholder, mock or TODO code, no fake data, and no hardcoded fallback values that hide missing data.
- **TypeScript strict:** no `any`, no `ts-ignore`, no non-null assertions used to silence errors.
- No new dependencies and no new files unless truly needed.
- When asked to keep some items and remove the rest (for example keep 2 texts in a card): delete exactly the other elements, then clean up whatever became unused (variables, imports, props, state, helper functions, styles), after checking by search that nothing else uses them. Do not delete shared components or functions used in other files. Check that spacing and layout still look right after the removal.

### 4. VERIFY BEFORE YOU SAY DONE (mandatory)
A task is done only when all of these pass:
1. `git diff` shows only the intended lines changed and nothing else.
2. Type check passes with zero new errors (`npx tsc --noEmit` or the project script).
3. Lint passes for the touched files, with no unused imports or variables left behind.
4. **Behaviour check.** For UI changes, trace the JSX or run the dev server and confirm the screen shows exactly what was requested. For logic changes, trace the data flow end to end and check edge cases: empty data, zero values, old localStorage data, role differences, mobile view.
5. For tiny text or style changes, steps 1 to 3 are enough. Run the full build only for medium or large changes, or before a final delivery.
If any check fails or the result is not exactly as requested: fix it and run the checks again. Repeat up to 3 times. If it still fails, stop and report exactly what fails and why. Never claim success without having run the checks, and never hide a failure.

### 5. NEVER BREAK EXISTING WORK
Before changing shared types, context functions or data shapes, search for all usages and update every one. Keep old saved data (localStorage) loading correctly. Do not touch unrelated modules.

### 6. REPORTING
Final message: **maximum 5 lines.** What changed (file and what), what you verified (which checks ran and the result), and anything I must know. No long explanations and no repeating the code.

### 7. WORKING SET FILE (fixes slow search on recently edited files)
Maintain `WORKING_SET.md` at the repo root. After every completed task add an entry at the top and keep only the latest 10 entries. Each entry has:
- date and a one line task description
- files touched, with the exact component or function names and one search string that lands on the change
- anything left unfinished
At the start of every task read this file first. If I ask for a small change in the file you just worked on, go directly to the recorded file and anchor, read the small range, edit and verify. Do not search the repo again.

### 8. WHAT NOT TO DO
- Do not explore the repo to understand it better for a simple change.
- Do not ask permission for obvious steps.
- Do not write long plans or essays for tiny tasks.
- Do not leave the project in a broken state. If you must stop, say what state it is in.

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

