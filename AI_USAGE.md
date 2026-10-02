# AI_USAGE.md

## Tools Used
- **LLM Assistant:** Used extensively for code generation, scaffolding, and documentation drafting.
- **Copilot / Inline AI:** Used for autocomplete during UI styling and minor logic adjustments.

## Where AI Saved Real Time
- **Prisma Schema & Seed Data:** Generating the relational schema and the boilerplate for seeding 4 users and 2 organizations took minutes instead of 45 minutes.
- **Tailwind UI Layouts:** Generating the standard grid layouts for the Agent Queue and Founder Dashboard.
- **Playwright Skeleton:** AI quickly generated the basic test runner structure and page object interactions.

## Where AI Produced Bad Output
- **Directory Context:** Initial code snippets placed files in `app/` instead of `src/app/`, requiring manual refactoring.
- **Over-engineering Auth:** Early AI suggestions recommended complex OAuth flows and NextAuth configurations that were unnecessary for a closed B2B system with 60 users.

## Recommendation Rejected
- **AI Suggestion:** "Use a library like `zod-form-data` to parse your Server Actions."
- **Why Rejected:** Standard `FormData` parsing with a simple `z.object({}).safeParse()` is perfectly adequate for a 6-hour MVP and adds zero extra dependencies.

## How I Verified Generated Code
- **Visual Testing:** Manually clicked through every flow in the browser.
- **Security Testing:** Manually manipulated URLs while logged in as different roles to verify the middleware was catching unauthorized access.
- **Automated Testing:** Ran the generated Playwright test to ensure the cross-tenant isolation logic actually threw 404s.

## Architecture Decisions That Were Mine
- **Scope:** Explicitly cutting email ingestion and file attachments.
- **Data Model:** Designing the `TicketEvent` table to act as an audit log for internal notes and status changes.
- **AI Strategy:** Choosing an 8-second timeout with a graceful fallback rather than letting the AI call hang indefinitely.
