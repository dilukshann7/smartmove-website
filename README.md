# SmartMove website

Next.js 16, Tailwind and shadcn UI for public trip search and passenger bookings. Oracle stores accounts, trips, bookings, tickets, refunds and feedback status. MongoDB stores feedback content and the passenger notification inbox. The home page's featured routes and announcement remain labelled sample content.

## Local Oracle setup

The live `XEPDB1` database on this machine has one-time migrations `../smartmove-database/database/oracle/09_web_integration.sql`, `10_passenger_portal.sql`, and `11_admin_workspace.sql` applied. Migration 11 adds admin sessions, guarded finance and trip-cancellation procedures, and grants for the management routines. The `SMARTMOVE_WEB` user was created separately with a random password. Credentials are in the ignored `.env.local` file:

```text
ORACLE_USER=SMARTMOVE_WEB
ORACLE_PASSWORD=<local generated password>
ORACLE_CONNECT_STRING=localhost:1521/XEPDB1
MONGODB_URI=mongodb://127.0.0.1:27017
MONGODB_DB=smartmove
```

For another database, create a dedicated `SMARTMOVE_WEB` user with a new password in `XEPDB1`, apply migrations 09, 10, then 11 as SYSDBA after the base SmartMove schema, then set the environment variables. These are one-time scripts; do not rerun them on this database. Oracle and MongoDB services must be running. Never commit `.env.local` or use the example passwords in the coursework scripts.

To create the first real admin locally, run `node scripts/create-admin.mjs` in an interactive terminal with local SQL*Plus OS SYSDBA access. It prompts for an email and a hidden password, stores only a scrypt hash, and leaves the disabled demo admin untouched. Public signup creates passengers only. Admins and passengers use `/login`; successful logins go to `/admin` and `/dashboard` respectively.

## Current workflow

- `/` searches by origin, destination and date. `/trips` shows matching scheduled trips and filters by departure time, fare and seats needed.
- `/trips/[id]` shows route and vehicle details, available seats and a fare summary. One booking can reserve multiple seats atomically.
- `/signup` and `/login` create and authenticate passenger accounts. The session is stored server-side in Oracle with an HTTP-only cookie.
- `/dashboard` is the default after login. It shows the next trip, pending reservations, bookings, tickets, completed trips, refunds and notifications.
- `/bookings` and `/bookings/[id]` show reservations, ticket links and whole-booking cancellation before departure. `/tickets/[id]` shows a passenger's own issued ticket.
- `/feedback` accepts one review per confirmed booking on a completed trip, or a complaint linked to any owned booking. Oracle stores type and status; MongoDB stores text, ratings and staff replies. This phase displays replies but has no staff reply UI.
- `/profile` lets passengers change their name and phone; email is read-only. The notification inbox supports read/unread state and reconciles newer Oracle booking/refund events when opened; there are no push updates.
- `/admin` is the single ADMIN workspace. It has live summary cards and guarded forms for routes, trips, vehicles, drivers, passengers, maintenance, bookings, payments, and eligible full refunds. Tickets follow booking/payment actions. Feedback is read-only. There are no separate staff role screens, admin user management, or standalone report pages.
- Admins manage passenger announcements in MongoDB as drafts, published notices, or archived notices. The public home reads published notices; the old sample document remains visible as sample content.

A new booking is **PENDING**. Seats are held for 30 minutes and automatically released if payment is not recorded. The existing staff-side `record_payment` procedure confirms a paid booking and issues its tickets; no online payment or staff payment UI is part of this website yet. Booking confirmation and issued tickets are never shown as paid before that procedure runs.

Cancellation releases every seat in the booking. For a paid booking, Oracle records one full refund in the cancellation transaction. **“Refund recorded” means a database record exists; any actual payout happens outside SmartMove.**

Database verification scripts: `../smartmove-database/database/oracle/tests/10_passenger_portal_rollback.sql` and `10_passenger_portal_concurrency.ps1`. MongoDB deduplication and cross-database failure checks: `node --env-file=.env.local scripts/test-passenger-mongo.mjs`. These tests preserve the existing sample records.

Admin checks: `../smartmove-database/database/oracle/tests/11_admin_workspace_rollback.sql`, `node --env-file=.env.local scripts/test-admin-queries.mjs`, and `node --env-file=.env.local scripts/test-admin-announcements.mjs`. A recorded refund is a database record; any actual payout happens outside SmartMove.

The project `AGENTS.md` asks not to start a development server or run a build unless explicitly requested. Typecheck and targeted lint are available through `npm run typecheck` and `npx eslint <paths>`.
