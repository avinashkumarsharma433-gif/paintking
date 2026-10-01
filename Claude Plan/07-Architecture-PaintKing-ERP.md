# PAINTKING ERP — TECH STACK + ARCHITECTURE
**Document 7 of 8 | Version 1.0**

Formalizes the stack recommendation from the BRD (Document 1, Section 7) into a full architecture — sized honestly for a single-plant, 50–150 employee job-work operation, not over-engineered for scale PaintKing doesn't have yet.

---

## 1. Stack Summary

| Layer | Choice | Why (not the default reasons — specific to PaintKing) |
|---|---|---|
| Frontend | Next.js + React + TypeScript + Tailwind + shadcn/ui | PWA-capable — matters because shop-floor tablets near spray booths need offline-tolerant, app-like behavior without a native app build/deploy pipeline |
| Backend | Node.js + NestJS + TypeScript | Same language as frontend — a 2–3 person team shouldn't context-switch between Python/Go and TS; NestJS's structure (modules/guards) maps directly onto the RBAC model already designed |
| Database | PostgreSQL 16 | Job-work traceability (Document 4) is fundamentally relational — foreign keys enforcing "no Packing Slip without passed PDI" are a database-level guarantee, not just an app-level check |
| ORM | Prisma | Fast schema iteration during the 16-week build; type-safe queries reduce a whole class of bugs a small team can't afford to chase |
| Object storage | AWS S3 (ap-south-1 / Mumbai) | QC photos are core evidence (Document 2, Module 6) — need durable, cheap, versioned storage; Mumbai region for latency + data residency |
| Auth | Self-managed JWT + refresh tokens | Keycloak/Auth0 add real operational overhead for ~50–150 users; revisit only if SSO with client systems is ever requested |
| Hosting | AWS Mumbai (ap-south-1) | Data residency (DPDP Act) + low latency to plant |
| Monitoring | Lightweight — hosted uptime check + error logging (e.g., a simple Grafana Cloud free tier or similar) | Full Prometheus/Loki stack is real infrastructure to maintain — not justified for this team size in Phase 1 |
| CI/CD | GitHub Actions + Docker | Standard, low-maintenance; Kubernetes explicitly **not recommended** at this scale (see Section 5) |

---

## 2. Architecture Diagram (text-based)

```
┌─────────────────────────────────────────────────────────────┐
│  Shop-floor tablets / desktop (Next.js PWA)                  │
│  - Offline queue for QC submissions (spray booth Wi-Fi gaps)  │
└───────────────────────┬───────────────────────────────────────┘
                        │ HTTPS (TLS 1.3)
┌───────────────────────▼───────────────────────────────────────┐
│  API Gateway / Load Balancer (AWS ALB)                        │
└───────────────────────┬───────────────────────────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│  NestJS Application (containerized, 2+ instances for HA)      │
│  ┌───────────┐ ┌───────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Auth/RBAC │ │ Job Card  │ │ QC / FPA   │ │ Dispatch /   │  │
│  │ Guard     │ │ Module    │ │ Module     │ │ Invoicing    │  │
│  └───────────┘ └───────────┘ └────────────┘ └──────────────┘  │
│  All modules share: audit-log interceptor (writes to           │
│  audit_logs on every mutating request, automatically)         │
└───────┬─────────────────────────────┬──────────────────────────┘
        │                             │
┌───────▼─────────────┐   ┌───────────▼─────────────┐
│  PostgreSQL 16       │   │  AWS S3 (Mumbai)         │
│  (RDS, Multi-AZ)     │   │  QC photos, documents    │
│  Primary + Read      │   │  Versioned, encrypted     │
│  Replica for reports │   └──────────────────────────┘
└──────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Scheduled jobs (Node cron / BullMQ, single lightweight       │
│  queue): TAT status recompute, backup trigger, webhook retry  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Modular Monolith vs. Microservices — Decision

**Decision: Modular Monolith.**

Reasoning specific to this project, not a generic default:
- 13 modules (Document 2) with heavy cross-module dependency (Job Card is referenced by nearly everything) — microservices would mean constant cross-service calls for data that's naturally one transaction (e.g., "transition job card + check FPA + check IQC" is one business operation, not three services talking to each other).
- Team size (2–3 people) cannot operate microservices' operational overhead (service discovery, distributed tracing, multiple deploy pipelines) — this would slow the 16-week Phase 1 timeline, not speed it up.
- NestJS's module system gives clean internal boundaries (each of the 13 FRD modules = one NestJS module) without the deployment complexity of separate services.
- Revisit this decision only if a specific module (e.g., a future Customer Portal, Phase 2) needs independent scaling or a different tech stack — split *that* module out then, not preemptively now.

---

## 4. Security Architecture (OWASP Top 10 Alignment)

| OWASP Risk | Mitigation in this system |
|---|---|
| Broken Access Control | Server-side RBAC guard on every endpoint (not just UI hiding); role-scoped queries (e.g., Painter's job list query is filtered server-side, never trust a client-supplied filter) |
| Cryptographic Failures | TLS everywhere; S3 server-side encryption; password hashing (bcrypt/argon2), never plaintext |
| Injection | Prisma parameterized queries by default — no raw string-concatenated SQL |
| Insecure Design | Stage-gate logic (no Packing Slip without PDI, no Production without FPA) is enforced in the application/database layer, not just a UI warning |
| Security Misconfiguration | Infrastructure-as-code (Terraform or equivalent) for AWS resources — avoids manual console misconfiguration drift |
| Vulnerable Components | Automated dependency scanning in CI (GitHub Dependabot, free and sufficient at this scale) |
| Authentication Failures | Account lockout after 5 failed attempts (15 min), OTP for MD/Plant Head, refresh-token rotation |
| Software/Data Integrity | Audit log on every mutation (Document 4); no hard deletes anywhere in the schema |
| Logging/Monitoring Failures | `audit_logs` table + basic error monitoring (Section 1) |
| SSRF | Backend never fetches arbitrary user-supplied URLs; S3 uploads go through pre-signed URLs generated server-side |

---

## 5. Scalability Plan

**Honest assessment:** PaintKing is a single-plant, ~50–150 employee operation. A "1K → 100K users" scaling narrative (as the original template requested) doesn't reflect this business's actual trajectory — the realistic scaling axis is **job card volume and photo storage**, not concurrent users.

| Stage | Trigger | Action |
|---|---|---|
| Current (Phase 1) | Single plant, <200 users | Single NestJS deployment (2 instances for HA), single Postgres primary + 1 read replica |
| Growth | Job card volume grows 3–5x, or a second plant opens | Add plant_id-based data partitioning (schema already supports this per Document 4); horizontally scale NestJS instances behind the load balancer — no architecture change needed, just more instances |
| Significant growth | Multi-plant with hundreds of concurrent shop-floor users | Consider splitting out the QC/photo-heavy path as its own scaled service if it becomes a bottleneck — revisit modular monolith decision *then*, with real data, not speculatively now |

Kubernetes is explicitly **not recommended** for Phase 1 or the "Growth" stage above — Docker + a managed container service (AWS ECS/Fargate) gives the HA benefit without a dedicated ops person to run a Kubernetes cluster, which this team doesn't have.

---

## 6. Backup & Disaster Recovery

| Component | Strategy |
|---|---|
| PostgreSQL | Automated daily snapshots (RDS), point-in-time recovery enabled, 30-day retention minimum; audit_logs backed up with extended retention (5 years, per BRD NFR) separately from operational snapshots |
| S3 (photos/documents) | Versioning enabled (protects against accidental overwrite); cross-region replication optional if budget allows, not mandatory at current scale |
| Disaster recovery target | RPO (Recovery Point Objective): 24 hours acceptable given daily backup cadence; RTO (Recovery Time Objective): a few hours acceptable — this is a job-work operation, not a 24/7 e-commerce platform, so aggressive multi-region failover is not justified spend |

---

## 7. Data Residency (DPDP Act 2023)

- All infrastructure in AWS `ap-south-1` (Mumbai) — database, object storage, and application servers.
- No data processing outside India for Phase 1 scope.
- If a future integration (e.g., a client's overseas ERP, Phase 3 API integration per BRD scope) requires data leaving India, that specific integration needs its own DPDP compliance review — not a blanket architecture decision made now.

---

**Assumptions flagged for confirmation:**
1. Team size of 2–3 people is assumed for the "don't over-engineer" recommendations throughout (modular monolith, no Kubernetes, lightweight monitoring) — if you're actually hiring a larger agency team, some of these trade-offs could reasonably shift.
2. RDS Multi-AZ (managed Postgres with automatic failover) is recommended over a self-managed database — adds modest monthly cost but removes a failure mode this team can't easily troubleshoot at 2am.

---
*Next: Document 8 — UI/UX Wireframe Documentation, covering role-based dashboards and the shop-floor-first design approach referenced throughout.*
