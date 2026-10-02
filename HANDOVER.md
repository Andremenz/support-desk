# HANDOVER.md (For the Founder)

## What Was Delivered
You now have a working support platform. It has a customer portal to submit and track requests, an agent workspace to manage the queue, and a dashboard for you to see exactly how the team is performing. It also includes a safe AI assistant that helps agents draft replies faster.

## The Monday Workflow
1. **Agents:** Log in, check the "Unassigned" queue, pick a ticket, click "Assign to me", and use the "AI draft reply" button to get a starting point. Edit the draft, and send it.
2. **Customers:** Log in, click "New Request", describe their issue, and watch it update as your team replies.

## Known Limitations (The Honest Truth)
- **No email notifications:** Right now, customers must log into the portal to see your replies. They won't get an email ping.
- **No email-to-ticket:** Customers must use the web form; they cannot email your old shared inbox.
- **No file attachments:** Customers cannot upload screenshots yet.
- **Basic SLAs:** "Overdue" is currently hardcoded to 8 hours. It doesn't account for weekends or business hours yet.

## The Next Five Things to Build
1. **Transactional Emails (Critical):** Integrate Resend/Postmark so customers get an email when an agent replies, and agents get pinged when a customer replies.
2. **File Attachments:** Add an S3/Cloudflare R2 bucket so customers can upload screenshots of bugs.
3. **Business Hours SLA Engine:** Upgrade the dashboard to only count "overdue" time during actual working hours (9-5).
4. **Magic Links / SSO:** Remove passwords for customers. Let them log in via a magic link sent to their company email to reduce friction.
5. **Knowledge Base Macros:** Allow agents to save standard answers (e.g., "How to reset API keys") and insert them with one click, which will also train the AI to draft better responses.

## Where This Architecture Breaks
- **At 100 users:** Works perfectly. You might just want to add pagination to the agent queue.
- **At 10,000 users:** The agent search will get slow. We will need to add full-text search (like Meilisearch) and move AI drafts to a background queue so the UI doesn't freeze while waiting for the AI.
- **At 1,000,000 tickets:** The database will choke on counting open tickets for your dashboard. We will need to move reporting to an analytics warehouse (like BigQuery) and archive old tickets.
