# PAINTKING — COMPLETE PROCESS FLOW (Material Inward → Dispatch)
**Supplementary Document | Role-wise action + report mapping**

> Note: QC checklist *content* (exact test points per stage) is shown generically below with standard test-method names (adhesion, gloss, DFT, color Delta-E) where relevant. These need to be cross-checked against your actual 13 paper formats before final build — this document sequences and assigns roles correctly, but the literal checklist items should be confirmed against what you already use, not invented fresh.

---

| # | Stage | Role Responsible | What They Do | Report/Document Generated | System Status After |
|---|---|---|---|---|---|
| 1 | **Client PO Received** | Production Supervisor | Receives client PO/order with part details, quantity, client's master sample (for color/finish), target delivery date | — (external input, not a system report yet) | — |
| 2 | **Job Card Created** | Production Supervisor | Creates Job Card in system: client, part description, quantity, process type (Spray/Hydrographic/UV/Moulding), **shade/color code reference to master sample**, target TAT | **Job Card** | `Created` |
| 3 | **Material Inward (GRN)** | Store Keeper | Client's material arrives at gate → physically received → checked for visible damage/shortage → mandatory photo taken | **GRN (Goods Receipt Note)** | `Material Received` |
| 4 | **Gate Entry Logged** | Security | Logs inbound vehicle/material at gate, links to GRN | **Gate Pass (Inward)** | (parallel, doesn't change Job Card stage) |
| 5 | **IQC — Incoming Quality Check** | IQC Inspector | Inspects client-supplied material *before* production starts — checks for damage, correct part/spec match, quantity match to GRN | **IQC Report** (Pass/Fail/Rework + photo) | `IQC` → Pass moves forward, Fail returns to Store Keeper for client coordination |
| 6 | **FPA — First Piece / Color Approval** | FPA/IPQC Inspector | Makes one sample piece → checks against client's master sample: **color match via spectrophotometer (Delta-E/wavelength reading against tolerance)**, finish, adhesion — submits photo + reading for approval | **FPA Report** (includes spectrophotometer reading + pass/fail on tolerance) | `FPA Approved` — bulk production **cannot start without this** |
| 6a | **Handover: Store → 3 Painters** | Store Keeper hands over, 3 Painters confirm | Store Keeper issues material allocated per Painter Job Card; each Painter confirms quantity received on their card before starting — mismatch requires a reason | **Handover Record** (sent vs. received per painter) | Blocks production start per painter until confirmed |
| 7 | **3 Painters Assigned & Master Card Split** | Production Supervisor | Splits Master Job Card across 3 line painters into 3 dedicated Painter Job Cards (`JC-xxx-P1`, `JC-xxx-P2`, `JC-xxx-P3`). Each painter sees only their card with allocated qty, shade code, and FPA photo reference | **3 Painter Child Job Cards** | `In Production (Split to 3)` |
| 8 | **Bulk Production (Single Day Shift)** | 3 Painters / Machine Operators | Each painter executes spray/dipping/UV on their allocated batch during the single day shift. Sprayed qty, first-pass count, and rework pieces logged | **Production Logs per Painter** | (job cards stay `In Production`) |
| 8a | **Handover: 3 Painters → IPQC** | 3 Painters hand over, FPA/IPQC Inspector confirms | Painters log produced quantities; Inspector confirms count received before inspecting — catches loss per painter station | **Handover Record** | Catches loss between individual painters and inspection |
| 9 | **IPQC — In-Process QC & Rework Trigger** | FPA/IPQC Inspector | Periodic checks during run. If defects found (dust nibs, runs, orange peel, shade flaw), parts are **routed to Rework Loop** (NOT scrapped) | **IPQC Report + Rework Job Card (`JC-xxx-RW1`)** | Rework parts route to Sanding/Re-spray |
| 9a | **Rework Processing Loop** | Surface Prep Operator & Assigned Painter | Defective parts are sanded/de-nibbed, cleaned, re-sprayed/re-dipped, and re-baked. Consumables logged as rework issue | **Rework Batch Progress** | `Rework In Progress` |
| 10 | **Production Complete & Day-End Shutdown** | Production Supervisor / Painters | When day ends, Supervisor executes **Daily Day-End (EOD) Plant Shutdown**: logs total pieces sprayed, counts open rework WIP, and shuts down plant until morning (no shift handover) | **Daily EOD Closure Report** | Plant Closed / Reopens Morning |
| 10a | **Handover: Production/Rework → OQC** | Supervisor/Painter hands over, OQC Inspector confirms | Two-sided quantity confirmation of both first-pass passed pieces and rework-cleared pieces | **Handover Record** | Catches loss before final OQC |
| 11 | **OQC — Outgoing Quality Check** | OQC/PDI Inspector | Final inspection on complete batch including rework-cleared parts. Any secondary defects route back to rework; only unsalvageable parts marked scrap | **OQC Report** (Pass/Rework/Scrap breakdown) | `OQC Passed` |
| 12 | **PDI — Pre-Dispatch Inspection** | OQC/PDI Inspector | Last gate before goods can leave — final visual/count check just before packing | **PDI Report** (Pass/Fail) | `PDI Passed` — **Packing Slip cannot be generated without this passing** |
| 12a | **Handover: PDI → Dispatch** | OQC/PDI Inspector hands over, Dispatch Coordinator confirms | Same two-sided quantity confirmation before Packing Slip generation | **Handover Record** | Catches loss between PDI and packing specifically |
| 13 | **Packing Slip Generated** | Dispatch Coordinator | Generates packing slip from PDI-passed quantity only (system auto-fills from PDI record) | **Packing Slip** | `Packed` |
| 14 | **FG Offer / Production Offering Report** | Dispatch Coordinator | Generates finished-goods offer report and production offering report for internal/client record | **FG Offer Report**, **Production Offering Report** | (supporting docs for dispatch) |
| 15 | **Gate Pass — Outward** | Security | Logs outbound vehicle, links to job card/packing slip | **Gate Pass (Outward)** | — |
| 16 | **Billing Documents** | Accountant | Generates **Delivery Challan** (material movement, no GST — ownership doesn't transfer) and **GST Invoice** (job-work service charge only, correct SAC code) | **Delivery Challan** + **GST Invoice** | — |
| 17 | **Dispatched** | Dispatch Coordinator / Security | Goods physically leave the plant | (Job Card closed) | `Dispatched` |
| 18 | **Audit Trail** | System (automatic) | Every single action above — who, what, when — is logged automatically, no manual step | **Audit Log** (always running in background) | continuous |

---

## Roles That Run in Parallel (not tied to one stage)

| Role | What they see/do throughout the process |
|---|---|
| **Store Manager** | Reconciles material received vs. issued vs. scrapped vs. returned, at any point — cross-checks Store Keeper's entries |
| **Plant Head / MD** | Live dashboard — WIP by process line, individual painter output, rework recovery yield %, TAT breach list |
| **HR Executive** | Employee records, leave — independent of job card flow |

---

## Where Color/Spec Matching Actually Sits

Color/wavelength matching against the client's master piece happens at **two points**, not one:
1. **FPA (Step 6)** — first-piece approval, before bulk starts. This is the critical gate — if color is wrong here, nothing gets wasted.
2. **IPQC (Step 9)** — spot-checked during the run, because color can drift mid-batch (paint mixing inconsistency, UV ink batch variation, etc.).

Both record a **spectrophotometer reading field** (Delta-E value $\le 0.70$ or wavelength band) recorded against a **tolerance limit**.

---

## Key Operational Rules Confirmed by Leadership

1. **3 Painters = 3 Job Cards (Step 7):** When a batch hits the floor, it splits into 3 distinct Painter Job Cards. Each painter manages their own card, allocated quantity, sprayed count, and first-pass yield.
2. **Single Shift Operation Only (Step 8 & 10):** Plant operates on a single general day shift (morning to evening). No night shifts or shift rotation handovers. Daily EOD shutdown freezes daily numbers, and operations safely restart next morning.
3. **Rework on Rejection (Step 9 & 11):** Defective parts are NOT scrapped. They enter a dedicated Rework Child Job Card (`JC-xxx-RW1`) for de-nibbing, touch-up sanding, re-spraying, and re-baking to salvage full batch yield.

---
*This flow document is a companion to Documents 1–8 — fully updated with PaintKing's confirmed factory ground-truth operational rules.*
