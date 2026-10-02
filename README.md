# SupportDesk MVP

A lightweight B2B support platform built as a solo AI-assisted engineering
assessment. Customers can submit and track support tickets, agents can manage
and reply to tickets, and founders can review support metrics.

## Local setup

1. Copy `.env.example` to `.env`. Set `DATABASE_URL` to your Neon PostgreSQL
   connection string and replace `JWT_SECRET` with a randomly generated secret
   of at least 32 bytes. `OPENAI_API_KEY` is optional; AI draft replies use a
   local fallback when it is not set.
2. Install dependencies and prepare the database:

   ```bash
   npm install
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Seeded demo accounts all
use the password `Password123!`:

- Customer: `alice@acme.com`
- Customer: `bob@northwind.com`
- Agent: `maya@support.com`
- Founder: `sam@support.com`

## End-to-end tests

Install the Playwright Chromium browser and run the full workflow and
cross-tenant isolation tests:

```bash
npx playwright install chromium
npx playwright test
```

Playwright starts the development server automatically when one is not already
running. Tests use the database configured by `DATABASE_URL` and create tickets
as part of their workflows.
