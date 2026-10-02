# DECISIONS.md

## 1. Require customer accounts instead of anonymous ticket links
- **Decision:** Require customer accounts instead of anonymous ticket links.
- **Reason:** Customer isolation is mandatory for a B2B product.
- **Alternative considered:** Anonymous ticket access using secret URLs.
- **Trade-off accepted:** More friction for customers, but much stronger privacy and security.

## 2. Use web portal as the front door instead of email ingestion
- **Decision:** Use web portal as the front door instead of email ingestion.
- **Reason:** Email ingestion is too risky for a 6-hour MVP (requires background workers, webhook routing, DKIM/SPF handling, which creates massive risk for silent failures/dropped emails).
- **Alternative considered:** Email-to-ticket pipeline via SendGrid/Postmark.
- **Trade-off accepted:** Requires a behavior change from customers.

## 3. AI drafts replies but does not send
- **Decision:** AI drafts replies but does not auto-send.
- **Reason:** Reduces inconsistent answers without risking customer-facing mistakes or hallucinated policy promises.
- **Alternative considered:** Fully automated AI responses for low-priority tickets.
- **Trade-off accepted:** Less flashy demo, but safer and easier to defend to Enterprise clients.

## 4. Use Neon Postgres locally and in production
- **Decision:** Use Neon Postgres for both local and production environments.
- **Reason:** Simple setup, identical schema behavior in dev and prod, and Neon's serverless architecture pairs perfectly with Vercel.
- **Alternative considered:** SQLite locally.
- **Trade-off accepted:** Requires an internet connection for local dev, but eliminates "it works on my machine" database dialect bugs.

## 5. Minimal custom auth
- **Decision:** Minimal custom auth (JWT in HttpOnly cookies).
- **Reason:** Fast to implement, gives full control over the payload for middleware role-gating.
- **Alternative considered:** NextAuth/Auth.js.
- **Trade-off accepted:** We lack advanced features like magic links or SSO out of the box.

## 6. No real email notifications
- **Decision:** No real email notifications in the MVP.
- **Reason:** Keeps the timebox focused on the core data model and security.
- **Alternative considered:** Resend/Postmark integration.
- **Trade-off accepted:** Customers must log into the portal to check status. 

## Decisions I Would Revisit
1. **Minimal custom auth:** A real product should use hardened auth with magic links, SSO, lockouts, and session revocation.
2. **No real email notifications:** Customers still expect email updates. The portal-only front door is a behavior change and the absolute first thing to build next.
