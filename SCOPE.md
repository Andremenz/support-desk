# SCOPE.md — SupportDesk MVP

## 1. Context & Problem Statement
**Company Profile:** A B2B SaaS company with ~60 paying customers (Starter to Enterprise tiers). 
**Current State:** Support is handled via a shared email inbox and a tracking spreadsheet.
**Core Problems:**
1. Requests get lost or forgotten (silent failures).
2. High-value (Enterprise) customers are not prioritized.
3. Answers to recurring questions are inconsistent.
4. The founder lacks visibility into support performance ("Are we slow?").

## 2. Users & Personas
- **Customer:** Needs a single front door to report issues, track status, and reply.
- **Agent (2 users):** Needs a unified queue to prioritize, reply with context, and hand off cleanly.
- **Founder:** Needs high-level metrics to assess SLA compliance.

## 3. MVP Scope
**Customer Portal:** Secure auth, "New Request" submission, ticket list, threaded replies.
**Agent Workspace:** Unified queue, ticket detail, assign/status/priority actions, internal notes.
**AI Capability:** "Draft Reply" button (Agent reviews/edits before sending).
**Founder Dashboard:** Open tickets, unassigned, overdue first-response, median response time.

## 4. Non-Goals (Explicitly excluded to ensure Day 1 stability)
- Email-to-ticket ingestion & outbound email notifications.
- File attachments.
- Complex SLA engines / Business Hours calculators.

## 5. Main Risks & Mitigations
- **Cross-Tenant Leakage:** Strict `organization_id` filtering. Unauthorized access returns `404`.
- **Prompt Injection:** Customer text treated as untrusted data. AI only drafts, never auto-sends.
- **AI Outages:** 8-second timeout. Fails gracefully to standard text box.
