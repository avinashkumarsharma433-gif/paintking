# PaintKing Specifications & RFC Registry (EGM Workflow)

This directory houses all technical specifications and Requests for Comments (RFCs) created via the **Elephant-Goldfish Model (EGM)** framework.

## Specification Lifecycle

```
[Idea / Feature Request]
          │
          ▼  /egm:egm-brainstorm
  [concepts_brief.md]
          │
          ▼  /egm:egm-draft
  [RFC Draft (in docs/specs/)]
          │
          ▼  /egm:egm-review (Zero-Context Goldfish Subagents)
  [Deficiency Findings]
          │
          ▼  /egm:egm-resolve
  [Approved Specification]
          │
          ▼  Implementation (Strict PK-OS Coding Instructions)
  [Production Code]
```

## Active Specifications

| RFC ID | Title | Status | Target Module | Spec File |
|---|---|---|---|---|
| RFC-0001 | Feature Template Example | Template | `src/portal` | [template_rfc.md](./template_rfc.md) |

## Guidelines for Authors (The Elephant)
1. Always start from [`template_rfc.md`](./template_rfc.md).
2. Reference `AGENTS.md` and `Design.md` to ensure full compliance with PaintKing brand tokens and portal architecture.
3. Once drafted, invoke `/egm:egm-review` to launch fresh-eye review subagents.
4. Resolve all critical findings using `/egm:egm-resolve` before writing production code.
