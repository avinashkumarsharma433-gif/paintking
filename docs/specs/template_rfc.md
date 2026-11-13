# [RFC-XXXX] Feature Name Specification

> **Status:** Draft | Under Review | Approved | Implemented  
> **Author:** PK-OS Agent / Architect  
> **Created:** YYYY-MM-DD  
> **Target Module:** `src/portal/...` or `src/pages/...`  
> **EGM Phase:** Elephant Draft | Goldfish Review | Resolved  

---

## 1. Executive Summary & Problem Statement
- **What problem does this feature solve?**
- **Target users / roles:** (e.g., Admin, Stores Incharge, Production Manager, Customer)
- **High-level outcome:**

---

## 2. User Stories & Acceptance Criteria
- [ ] **US-1:** As a [role], I want to [action] so that [outcome].
  - *Acceptance Criteria:*
    - Given [state], when [action], then [result].
- [ ] **US-2:** ...

---

## 3. Technical Architecture & Data Contract

### 3.1 Data Models & TypeScript Types
```typescript
// Explicit TypeScript strict types (No 'any', no 'ts-ignore')
export interface FeatureDataModel {
  id: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 State Management & Persistence
- **Storage Layer:** Supabase table / LocalStorage key / React Context.
- **Data Migration & Backward Compatibility:** How existing data handles schema changes.

### 3.3 Component Hierarchy & Props
- `ParentView.tsx`
  - `FeatureSummaryTable.tsx` (Desktop 4-column summary)
  - `FeatureCardMobile.tsx` (Mobile <640px 3-row responsive card)
  - `FeatureDetailModal.tsx` (Detailed inspection & actions)

---

## 4. UI/UX & PaintKing Design Tokens Compliance

| Design Requirement | Specification | Checked |
|---|---|:---:|
| **Primary Accent Gold** | `#c09748` for buttons, active tabs, highlights | [ ] |
| **Ink & Slate Contrast** | `#17191c` for primary dark text, `#777b86` for body text | [ ] |
| **No Pitch-Black Buttons** | Use `bg-[#f2f2f3] hover:bg-[#e5e7eb] text-[#17191c] border border-[#dcdfe4] rounded-full` | [ ] |
| **Icons Standard** | `lucide-react` icons ONLY (No emojis) | [ ] |
| **List View 4-Column Rule** | Desktop tables show max 4-5 summary columns (`Ref & Date`, `Party`, `Material & Qty`, `Status`, `Action`) | [ ] |
| **Mobile Card Adaptation** | Hide table on `<640px`, render 3-row cards (`bg-[#fafafb] rounded-[18px] border border-[#ececec]`) | [ ] |
| **Date Inputs** | Must use `<PaintkingDatePicker />` | [ ] |
| **PDF Generation (if applicable)** | Grey header (`[242, 242, 243]`), Charcoal text, table border `[180, 185, 195]`, width 0.45 | [ ] |

---

## 5. Edge Cases & Error Boundaries
- **Empty States:** Visual cue when no records exist.
- **Offline / Network Latency:** Optimistic updates or spinner states.
- **Validation Bounds:** Zero values, negative values, missing required fields.
- **Concurrent Updates:** Conflict prevention or last-write-wins policy.

---

## 6. Goldfish Adversarial Review Checklist (Zero-Context Audit)
*The Goldfish subagents will evaluate this draft against the following rubrics:*
1. **Scope & Zoom-Out:** Does this spec duplicate existing ERP utilities or introduce unnecessary complexity?
2. **Comprehension & Ambiguity:** Are all state transitions and edge cases clearly documented without assumed knowledge?
3. **PaintKing Rules:** Does any UI component violate `AGENTS.md` or `Design.md`?
4. **Implementation Readiness:** Can an engineer implement this without making ad-hoc design decisions?

---

## 7. Review Findings & Resolution Log
| Phase | Reviewer Lens | Finding / Critique | Classification (PROPOSE FIX / CONTEST) | Action Taken |
|---|---|---|---|---|
| Initial | `egm-zoom-out` | - | - | - |
| Clarity | `egm-comprehension` | - | - | - |
| Flaws | `egm-critic` | - | - | - |
