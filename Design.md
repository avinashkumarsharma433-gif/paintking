# 🎨 PaintKing UI/UX Design System (`Design.md`)

> **Document Type:** Master Visual & UI/UX Design System Specification  
> **Brand Entity:** PaintKing Surface Solutions (`https://paintking.in/`)  
> **Aesthetic Philosophy:** Editorial Industrial Luxury  
> **Frameworks:** Tailwind CSS v4 + Motion React + Lucide Icons  
> **Last Updated:** September 2026  

---

## 1. Aesthetic Philosophy: Editorial Industrial Luxury

PaintKing operates in heavy industrial manufacturing, but its digital surface is engineered with an **Editorial Industrial Luxury** aesthetic—combining clean Swiss precision, spacious editorial typography (Newsreader / Source Serif 4 paired with Plus Jakarta Sans), champagne and fog paper surfaces, and the **signature PaintKing Gold accent (`#c09748`)**.

### Core Guiding Principles:
1. **Restrained Luxury over Clutter:** Generous white space, subtle hairline borders (`#ececec`), and soft fog backgrounds replace harsh industrial grids.
2. **No Raw Excel Spreadsheets in the UI:** Never render raw spreadsheet black borders (`border-2 border-black`) or artificial empty rows. Present factory records as bespoke luxury certificates.
3. **No Emojis for Industrial Icons:** Always use semantic SVG vector icons from `lucide-react` (e.g. `<ShieldCheck>`, `<Truck>`, `<Package>`, `<CheckCircle2>`). Never use system emojis.
4. **Pill-First Interactive Architecture:** Interactive buttons, category filters, breadcrumbs, and status tags adhere strictly to fully rounded pill architecture (`rounded-full` / `9999px`).

---

## 2. Design Tokens & Color Palette

### Primary Achromatic System
| Token Name | Hex Code | Visual Application |
|---|---|---|
| `--color-ink` | `#17191c` | Primary deep charcoal/black for text, dark capsules, primary buttons, and high-contrast table headers |
| `--color-paper` | `#ffffff` | Primary bright background paper, elevated cards, and clean canvas |
| `--color-fog` | `#fafafb` | Soft secondary surface, section alternating bands, and table row hover states |
| `--color-mist` | `#f2f2f3` | Subtle chip backgrounds, summary row highlights, and neutral divider fills |
| `--color-slate` | `#777b86` | Secondary body text, paragraph descriptions, and subtitle copy |
| `--color-ash` | `#979799` | Tertiary metadata, small captions, and inactive tags |
| `--color-smoke` | `#a3a6af` | Subtle divider lines, border accents, and placeholder text |

### PaintKing Brand Gold Accent System
| Token Name | Hex Code | Visual Application |
|---|---|---|
| `--color-accent-50` | `#faf7ed` | Ultra-light subtle card glow and input field active tints |
| `--color-accent-100` | `#faf3e0` | **Champagne Tint:** Surface for badges, checkmarks, highlights, and doc pill chips |
| `--color-accent-200` | `#f4e5be` | Champagne border outlines and subtle warning boundaries |
| `--color-accent-500` | `#c09748` | **Official PaintKing Brand Accent Gold:** Primary accent, part code codes, and brand dots |
| `--color-accent-600` | `#a97e35` | Gold button hover state |
| `--color-accent-700` | `#8a6521` | Deep gold text on champagne backgrounds for WCAG AA high-contrast compliance |

### Industrial Quality Status Colors
| Semantic Status | Surface Tint | Border Token | Text Token | Icon |
|---|---|---|---|---|
| **Accepted / Pass** | `bg-emerald-50` | `border-emerald-200` | `text-emerald-800` | `<CheckCircle2 className="text-emerald-600" />` |
| **Over-Run / Warning** | `bg-amber-50` | `border-amber-200` | `text-amber-800` | `<AlertCircle className="text-amber-600" />` |
| **Rejected / Discrepancy Halt**| `bg-rose-50` | `border-rose-200` | `text-rose-700` | `<ShieldAlert className="text-rose-600" />` |
| **Pending / In Review** | `bg-blue-50` | `border-blue-200` | `text-blue-800` | `<Clock className="text-blue-600" />` |

---

## 3. Typography Hierarchy

### Display & Headings (`font-serif`)
- **Primary Serif Stack:** `Newsreader`, `Source Serif 4`, `Georgia`, `serif`.
- **Character:** Authoritative, editorial, and elegant. Headings whisper luxury rather than shouting in aggressive bold.
- **H1 Display:** `text-4xl sm:text-6xl font-serif font-normal tracking-tight leading-tight`
- **H2 Section Title:** `text-2xl sm:text-4xl font-serif font-normal tracking-tight text-[#17191c]`
- **H3 Card Title:** `text-lg sm:text-xl font-serif font-medium text-[#17191c]`

### Body & Interactive UI (`font-sans`)
- **Primary Sans Stack:** `Plus Jakarta Sans`, `Inter`, system `sans-serif`.
- **Character:** Crisp, functional, and highly legible across both desktop workstations and mobile shopfloor tablets.
- **Section Eyebrow:** `text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#c09748]`
- **Body Paragraph:** `text-sm sm:text-[15px] text-[#777b86] leading-relaxed font-normal`
- **Table Cell Data:** `text-xs text-[#17191c] font-normal`
- **Serial Numbers / Part Codes:** `font-mono font-bold text-xs text-[#c09748]`
- **Pill Action Text:** `text-xs font-semibold tracking-wide`

---

## 4. Standardized Radii Hierarchy

| UI Component | Standard Radius Token | Tailwind CSS Class |
|---|---|---|
| **Page Modals & Lightboxes** | 24px | `rounded-[24px]` |
| **Hero Containers & Main Section Cards** | 24px | `rounded-[24px]` |
| **Document Previews & Media Frames** | 20px | `rounded-[20px]` |
| **Form Inputs & Search Fields** | 12px – 16px | `rounded-[12px]` to `rounded-[16px]` |
| **Tables & Outer Table Containers** | 16px – 18px | `rounded-[16px]` or `rounded-[18px]` |
| **Action Buttons, Badges, Breadcrumbs & Chips** | Fully Rounded (9999px) | `rounded-full` |

---

## 5. Component Patterns & Guidelines

### 1. Pill Step Breadcrumb Bar
Used in multi-step factory wizards (e.g. `CreateGRNModal`, `GatePassView`):
```tsx
<div className="flex items-center p-1 bg-[#fafafb] rounded-full border border-[#ececec]">
  <button className="flex-1 py-2 px-3 rounded-full text-xs font-medium bg-[#17191c] text-white shadow-xs flex items-center justify-center gap-2">
    <span className="w-4 h-4 rounded-full text-[10px] font-bold bg-white/20 text-white flex items-center justify-center">1</span>
    <span>1. Inward Overview</span>
  </button>
  <button className="flex-1 py-2 px-3 rounded-full text-xs font-medium text-[#777b86] hover:text-[#17191c] flex items-center justify-center gap-2">
    <span className="w-4 h-4 rounded-full text-[10px] font-bold bg-gray-200 text-[#777b86] flex items-center justify-center">2</span>
    <span>2. Quantity Verification</span>
  </button>
</div>
```

### 2. Modern Factory Data Table
Soft, rounded, accessible data tables with clean typography:
- **Outer Wrapper:** `overflow-x-auto border border-[#ececec] rounded-[18px] bg-white`
- **Header:** `bg-[#fafafb] text-[#777b86] font-semibold uppercase text-[10px] tracking-wider border-b border-[#ececec]` (or uniform dark `#17191c` without column color overrides)
- **Rows:** `hover:bg-[#fafafb] transition-colors` with subtle hairline divider `divide-y divide-[#ececec]`
- **Part Codes:** `font-mono font-bold text-[#c09748]`
- **Summary Row:** `bg-[#f2f2f3] font-bold text-[#17191c] border-t border-[#ececec]`

### 3. Factory Form Inputs
- **Base Input:** `w-full h-10 px-3.5 rounded-[12px] border border-[#e5e7eb] bg-white text-xs text-[#17191c] focus:outline-none focus:border-[#17191c] transition-colors`
- **Monospace Code Inputs:** Include `font-mono font-bold` for part numbers, vehicle plates, and challan codes.
- **Labels:** `block text-[11px] font-semibold text-[#777b86] uppercase tracking-wider mb-1.5`

### 4. Official Factory Documents & Printable Previews
Document views (e.g. `OfficialGRNDocument.tsx`) follow strict guidelines:
- White canvas: `bg-white rounded-[24px] border border-[#ececec] p-6 sm:p-8 space-y-6 shadow-xs`
- Standard brand header with gold dot and serif title.
- Clean key-value metadata cards (`bg-[#fafafb] rounded-[18px] border border-[#ececec] p-5`).
- Multi-signatory blocks (Store Incharge, QA Lead, Plant Head) in 3-column cards with checkmark verification stamps.
- Print media rules: `print:shadow-none print:border-none print:p-0`.

---

## 6. Accessibility & Micro-Interactions

- **Contrast Ratios (WCAG AA Compliance):**
  - Dark body text `#17191c` on white `#ffffff` achieves a 16.5:1 ratio (far exceeding the 4.5:1 threshold).
  - Slate secondary text `#777b86` on white `#ffffff` achieves 4.8:1.
  - Deep Gold `#8a6521` on Champagne `#faf3e0` achieves 4.9:1.
- **Keyboard Focus Rings:**
  ```css
  :focus-visible {
    outline: 2px solid #c09748;
    outline-offset: 2px;
  }
  ```
- **Motion & Transitions:**
  - Transition duration standard: 150ms to 300ms.
  - Easing curve: `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Respects `@media (prefers-reduced-motion: reduce)`.
- **Touch Targets:** All interactive buttons and filter chips feature an explicit `cursor-pointer` with minimum 36px touch targets.

---

## 7. SaaS Workbench & Modern App Layout Architecture (New)

Inspired by modern world-class SaaS software (e.g. Linear, Figma, Vercel, Temelio):

```
+---------------------------------------------------------------------------------------------------------+
| [🎨 PK Logo] Search ⌘K    |  Breadcrumbs: Inward > Gate Register  [Plant: Haridwar] [Day Shift]  [Profile]  |
+---------------------------------------------------------------------------------------------------------+
| LEFT NAV RAIL (w-64)       | SUB-PANEL / ELEMENT INSPECTOR (w-72) | MAIN STAGE CANVAS (flex-1)          |
| • Search & Quick Access    | • Segmented Tabs (Elements/Records)  | • Context Header & Action Toolbar   |
| • Department Workflows     | • Compact Draggable/Clickable items  | • White Canvas Card (rounded-[20px])|
| • Gate Security & Inward   | • Dense Filter Inputs (h-8, text-xs) | • Live Multi-column Form / Records  |
| • Stores & GRN             | • Real-time Count Badges             | • Sticky Status Footer              |
| • QA & IQC                 |                                      |   [✓ Auto-saved] [Preview] [Submit] |
+---------------------------------------------------------------------------------------------------------+
```

### Architectural Rules:
1. **Inset Canvas Framing (`rounded-[20px] bg-white border border-[#e5e7eb] shadow-sm`)**:
   - The entire working stage sits inside a structured, bounded canvas with clean grey perimeter background (`bg-[#f4f4f6]` or `bg-[#fafafb]`).
2. **Contextual Action Suite Header**:
   - Top of canvas displays: Breadcrumb path (`Module > Sub-view`), author metadata (`Created by: Ram Singh`), real-time plant badge, and high-density action buttons (`[PDF Preview]`, `[Export Excel]`, `[+ New Record]`).
3. **Ultra-Dense Typography (Photoshop/Figma Scale)**:
   - **Section Headers:** `text-xs sm:text-sm font-semibold text-[#17191c]`
   - **Field Labels / Meta:** `text-[10px] or text-[11px] font-medium text-[#777b86]`
   - **Input Fields:** `h-8 or h-8.5 px-2.5 rounded-[8px] text-xs font-mono / font-sans`
   - **Action Chips / Badges:** `text-[10px] font-semibold px-2 py-0.5 rounded-full`
4. **Sticky Bottom Workbench Footer**:
   - Persistent operational status line (`✓ Ready / Live Sync Active`) paired with primary action pills (`Submit Inward`, `Save Changes`, `Print Pass`).

---

## 8. Standard Button Theme & Visual Language (Crucial Rule)

### 1. No Pitch Black `#000000` on Primary Action Buttons
- Never use pitch black (`bg-black` or `bg-[#000000]`) on interactive action buttons or modal submit buttons.
- **Standard Button Style:**
  ```tsx
  className="px-4 sm:px-6 py-2 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
  ```
- **Icon Accent inside Buttons:** Always pair with the PaintKing Gold accent: `<Plus className="w-3.5 h-3.5 text-[#c09748]" />` or `<Check className="w-3.5 h-3.5 text-[#c09748]" />`.
- **Secondary / Cancel Buttons:**
  ```tsx
  className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#dcdfe4] bg-white text-xs font-medium text-[#777b86] hover:bg-gray-50 cursor-pointer transition"
  ```

---

## 9. Standardized List Views & Mobile Responsive Cards

### 1. The 4-Column Rule (Eliminate Cognitive Overload & Anxiety)
- Do NOT clutter desktop table rows with 10–12 columns of raw data.
- Row should contain only **3 to 4 crucial summary fields** + dedicated **Action** column (`View Details` + `PDF`):
  1. `1. REF & DATE` (`srNo` / `gatePassNo`, formatted date `DD-MM-YYYY`, live timestamp)
  2. `2. PARTY / SUPPLIER` (Customer/Party Name, Vehicle Plate, Transporter)
  3. `3. MATERIAL & QUANTITY` (Summary item description, formatted total quantity)
  4. `4. STATUS` (Clean semantic status chip e.g. `GRN-xxx` or `Dispatched & Passed`)
  5. `ACTION` (`View Details` button + `PDF` icon button)

### 2. Standard Mobile Responsive Card Architecture (`sm:hidden`)
On mobile screens (`<640px`), hide table view completely and render minimal 3-row structured cards:
```tsx
<div className="sm:hidden space-y-2.5">
  {items.map((item) => (
    <div key={item.id} className="bg-[#fafafb] p-3.5 rounded-[18px] border border-[#ececec] space-y-2 shadow-2xs">
      {/* 1. Header: Ref No + Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono font-bold text-xs text-[#c09748] tracking-tight shrink-0">
          {item.srNo}
        </span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-mono font-bold shrink-0">
          {item.status}
        </span>
      </div>

      {/* 2. Core Body: Party Name, Date, Material & Total Qty */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-semibold text-xs text-[#17191c] truncate">
            {item.partyName}
          </div>
          <div className="text-[10.5px] text-[#777b86] shrink-0 font-medium">
            {formatDateDDMMYYYY(item.date)}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="text-[#777b86] truncate max-w-[65%]">
            {item.descriptionOfMaterial}
          </div>
          <div className="font-mono font-bold text-xs text-[#17191c] shrink-0">
            {item.totalQty} {item.unit}
          </div>
        </div>
      </div>

      {/* 3. Actions Footer: View Details Modal Trigger + PDF Download */}
      <div className="pt-2 border-t border-[#ececec] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setSelectedRecord(item)}
          className="flex-1 h-8 rounded-full bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 shadow-2xs"
        >
          <Eye className="w-3.5 h-3.5 text-[#c09748]" />
          <span>View Details</span>
        </button>
        <button
          type="button"
          onClick={() => downloadRecordPdf(item)}
          className="h-8 px-3 rounded-full border border-[#dcdfe4] bg-white hover:bg-gray-100 text-[#17191c] text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer shrink-0"
          title="Download PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>PDF</span>
        </button>
      </div>
    </div>
  ))}
</div>
```

---

## 10. Multi-Step Form Wizard & Clean Input Architecture

### 1. Stepper Header Architecture
- Clear connected pill stepper:
  - Active Step: `border-[#17191c] text-[#17191c] bg-[#fafafb] shadow-2xs`
  - Inactive Step: `border-[#e5e7eb] text-[#777b86] hover:border-gray-400`
- Number badge inside pill: `w-4 h-4 rounded-full bg-[#17191c] text-white font-bold` when active.

### 2. Step 1 (General & Logistics Info) Layout
- Responsive 2-column grid (`grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5`).
- Standard Input Styling:
  ```tsx
  className="w-full h-9 px-3 rounded-[8px] border border-[#dcdfe4] bg-white text-xs text-[#17191c] placeholder:text-gray-400 focus:outline-none focus:border-[#17191c] transition-colors"
  ```
- Date Picker: Always use `<PaintkingDatePicker value={val} onChange={setVal} placeholder="DD-MM-YYYY" />`.

### 3. Step 2 (Dynamic Items & Materials Breakdown) Layout
- Dynamic row container with safe focus padding:
  ```tsx
  <div className="space-y-2 max-h-[195px] sm:max-h-[165px] overflow-y-auto no-scrollbar p-1">
  ```
  *(Note: The `p-1` safe padding ensures input focus rings `ring-1 ring-[#17191c]` are never clipped by the scroll container).*
- 12-Column Grid Row Breakdown on Desktop:
  - Part / Item Code: `sm:col-span-3`
  - Material Description: `sm:col-span-4`
  - Quantity: `sm:col-span-2 text-center`
  - Unit: `sm:col-span-2`
  - Delete Trash Button: `sm:col-span-1 text-center` with `p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-600 cursor-pointer`

---

## 11. Reusable Component Blueprint Reference

### 1. `PaintkingDatePicker` (`src/portal/components/PaintkingDatePicker.tsx`)
- Standard Indian Date format: `DD-MM-YYYY`.
- Quick Month & Year selector dropdowns.
- Clean calendar grid with Monday week start, today highlight, and active selected day in charcoal/gold.
- Fully mobile responsive with auto-positioning and backdrop click-outside detection.

### 2. `CenteredSelectModal` (`src/portal/components/CenteredSelectModal.tsx`)
- High-performance modal picker for large option datasets (Customers, Substrates, Part Numbers).
- Instant search filter, grouped options, and smooth mobile touch UX.

### 3. `ScrollRemainingToast` (`src/portal/components/ScrollRemainingToast.tsx`)
- Floating pill toast at the bottom of data tables informing operators of additional scrollable records below:
  ```tsx
  <ScrollRemainingToast
    containerRef={tableRef}
    totalCount={records.length}
    label="MORE RECORDS BELOW"
    position="bottom"
    className="hidden sm:flex"
  />
  ```

---

## 12. Standardized PDF Generation Engine (`src/portal/utils/pdfStandardHeader.ts`)

All official documents (Gate Inward Pass, Gate Outward Pass, Tax Invoices, Delivery Challans, IQC Inspection Slips, GRN Slips) strictly follow this layout blueprint:

1. **Company Header:**
   - Left: Official Base64 PaintKing Brand Logo (`w: 42mm, h: 14.5mm`).
   - Right: Business Name `PAINTKING` (bold 13pt), GSTIN, Phone (+91 9594591313), Email (info@paintking.in), and Website (www.paintking.in) aligned right.
   - Hairline separation divider at `y: 25mm`.
2. **Metadata Grid (3 Structured Rows):**
   - Rounded container with `#fafafb` fill and `#ececec` border.
   - Standard `drawMetaField`: Bold dark black `#17191c` uppercase label + clear Slate Grey `#777b86` content with 2-line auto-wrap and ellipsis protection.
3. **Item Table & Multi-Unit Calculations:**
   - Single-unit and mixed-unit auto-breakdown (`formatUnitBreakdown`).
   - Multi-page continuation support (`Page X of Y` + `continued to next page...`).
4. **Standard Footer & Legal Watermark:**
   - Bottom divider at `y: 283mm`.
   - ISO 9001:2015 & IATF 16949 certified legal note.
   - Live Indian timestamp stamp: `DD MMM YYYY, hh:mm:ss a`.

