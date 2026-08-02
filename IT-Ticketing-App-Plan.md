# IT Support Ticketing System — Full Plan & Build Prompt

## 1. Project Summary
A web application where **Clients (employees)** raise IT support tickets using a structured category/sub-category form, **Super Admin** triages and assigns tickets to the right **IT Engineer**, and the Engineer resolves and closes the ticket with resolution notes. Everyone gets notified at the right step.

---

## 2. User Roles & Access

| Role | Access |
|---|---|
| **Super Admin** | Full access. Views all tickets, all users. Creates/manages Engineer & Client accounts. Assigns tickets to engineers. Sets engineer "skills/access" (e.g., Network, Printer, Hardware). Views reports/dashboards. Can reassign/close/reopen any ticket. |
| **IT Engineer** | Sees only tickets assigned to them (or unassigned tickets matching their skill category, if you want that mode). Updates ticket status (In Progress), adds work notes, closes ticket with resolution details. Cannot see other engineers' tickets unless Admin allows. |
| **Client** | Raises tickets via the structured form. Views status/history of only their own tickets. Can add comments/reply if engineer asks for more info. Cannot see other clients' tickets. |

---

## 3. Ticket Form — Fields (as specified)

**Step 1 – Issue Category** (single select, required)
- PC Issue
- Laptop Issue
- Printer Issue
- Network Issue

**Step 2 – Sub-Option** (single select, required, options change based on Step 1)

| Category | Sub-options |
|---|---|
| PC Issue | PC not booting · Power on, no display · Hanging · Software issue |
| Laptop Issue | Laptop not booting · Power on, no display · Hanging · Software issue |
| Printer Issue | Printing not coming · Print error · Scan problem · Software not working |
| Network Issue | Network not connecting · Network slow issue · Wifi not connect |

**Step 3 – Description** (free text, required) — "Describe the problem you are facing"

**Step 4 – Asset / Contact Info** (required)
- System Asset ID (text) **or** Person Contact Number (text) — at least one required

**Step 5 – Location** (single select, required)
- 1st Floor
- 2nd Floor
- *(Admin should be able to add more floors/locations later via settings, so this list shouldn't be hardcoded in the DB — store it as a manageable lookup table.)*

**Auto-filled by system (not chosen by client):**
- Ticket ID (auto-generated, e.g., `TCK-2026-00123`)
- Raised by (logged-in client name/email — auto from session)
- Date & time raised
- Status (defaults to "Open")
- Priority (optional: let Admin set this after triage, e.g., Low/Medium/High/Critical — recommended to add even though not in your list, so engineers know what to pick up first)

---

## 4. Ticket Lifecycle / Workflow

```
1. CLIENT logs in → fills ticket form (category → sub-option → description → asset/contact → floor) → Submits
                          │
                          ▼
2. Ticket created with status = "OPEN"
   → SUPER ADMIN gets notified (email/in-app/dashboard badge)
                          │
                          ▼
3. ADMIN opens ticket → reviews details → picks an IT ENGINEER
   (ideally filtered to engineers whose "access/skill" matches the category, e.g.
    Network Issue → only engineers tagged "Network")
   → status changes to "ASSIGNED"
                          │
                          ▼
4. ENGINEER gets notified → opens ticket → sets status "IN PROGRESS"
   → can add internal work notes / ask client for more info (comment thread)
                          │
                          ▼
5. ENGINEER resolves the issue → sets status "RESOLVED/CLOSED"
   → fills mandatory Resolution Details (what was the root cause, what was done, time spent)
                          │
                          ▼
6. CLIENT gets notified ticket is closed → can view resolution → optionally reopen
   if the issue isn't actually fixed (status → "REOPENED" → back to step 4)
```

Status values: `Open → Assigned → In Progress → Resolved/Closed → (Reopened, optional)`

---

## 5. Engineer "Access" / Skill-Based Routing
Each engineer profile has one or more **skill tags**: `PC`, `Laptop`, `Printer`, `Network`.
When Admin opens an unassigned ticket, the assign-dropdown is **pre-filtered** to engineers whose skill tag matches the ticket's category — Admin can still override and pick anyone. This is what satisfies "engineer will be notified based on their access."

---

## 6. Notifications
- **In-app:** bell icon + badge count, notification list (real-time via WebSockets/Socket.io or polling).
- **Email:** on ticket created (to Admin), on assignment (to Engineer), on closure (to Client), on reopen (to Engineer/Admin).
- Optional: SMS/WhatsApp for Critical priority tickets.

---

## 7. Database Schema (core tables)

**users**
`id, name, email, password_hash, role (super_admin/engineer/client), phone, floor, is_active, created_at`

**engineer_skills**
`id, user_id (FK→users), skill (PC/Laptop/Printer/Network)`

**tickets**
`id, ticket_code, client_id (FK→users), category, sub_option, description, asset_id, contact_number, floor, priority, status, assigned_engineer_id (FK→users, nullable), created_at, assigned_at, resolved_at, closed_at`

**ticket_resolution**
`id, ticket_id (FK), engineer_id (FK), resolution_notes, root_cause, time_spent_minutes, closed_at`

**ticket_comments**
`id, ticket_id (FK), user_id (FK), message, created_at`

**locations** (lookup, so Admin can add floors)
`id, name`

**notifications**
`id, user_id (FK), ticket_id (FK), message, is_read, created_at`

**audit_log** (optional but recommended)
`id, ticket_id, action, performed_by, timestamp`

---

## 8. Pages / Screens

**Public**
- Login (single page, role auto-detected after auth) / Forgot password

**Client**
- Dashboard — my tickets (Open/In Progress/Closed tabs)
- Raise New Ticket (multi-step form as in section 3)
- Ticket Detail — status timeline, comments, resolution (read-only once closed)

**Super Admin**
- Dashboard — ticket counts by status/category/priority, SLA breaches
- All Tickets — filter/search/sort table
- Ticket Detail — assign engineer, set priority, view history
- Manage Users — create/edit/deactivate Clients & Engineers, assign engineer skills
- Manage Locations/Floors
- Reports — resolution time, tickets by category, engineer workload

**IT Engineer**
- Dashboard — my assigned tickets (Assigned/In Progress/Closed)
- Ticket Detail — update status, add comments, close with resolution form

---

## 9. Tech Stack Recommendation

| Layer | Suggestion |
|---|---|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Node.js + Express (or NestJS) — REST API |
| Database | PostgreSQL |
| Auth | JWT-based auth, bcrypt password hashing, role-based middleware |
| Real-time notifications | Socket.io |
| Email | Nodemailer (SMTP) or SendGrid |
| Hosting | Frontend on Vercel/Netlify, Backend+DB on Render/Railway/AWS |

*(Any equivalent stack — e.g., Django, Laravel, or a no-code tool like Bolt/Lovable — can follow the same schema and workflow.)*

---

## 10. Suggested Build Order (Milestones)

1. Auth system + 3 roles + role-based route guards
2. Database schema + seed data (locations, one admin, one engineer, one client)
3. Client: multi-step ticket form → creates ticket in DB
4. Admin: view all tickets, assign engineer (filtered by skill)
5. Engineer: view assigned tickets, update status, close with resolution form
6. Notifications (in-app first, email second)
7. Dashboards & reports
8. Polish: search/filter, SLA timers, reopen flow, audit log

---

## 11. Build Prompt (copy-paste into Claude Code / Cursor / Bolt / v0 / Lovable etc.)

```
Build a full-stack IT Support Ticketing web application with three roles: Super Admin,
IT Engineer, and Client. Use React + Tailwind for the frontend, Node.js + Express for
the backend, and PostgreSQL for the database. Use JWT auth with bcrypt password hashing
and role-based route protection.

ROLES & ACCESS
- Super Admin: full access to all tickets and users; can create/deactivate Engineer and
  Client accounts; assigns engineer "skill tags" (PC, Laptop, Printer, Network); assigns
  tickets to engineers; can reassign, reopen, or close any ticket; sees dashboards/reports.
- IT Engineer: sees only tickets assigned to them; can set status to "In Progress"; can add
  comments; must fill a mandatory resolution form (resolution notes, root cause, time
  spent) to close a ticket.
- Client: can raise new tickets and view only their own tickets and status history; can
  reply in a comment thread; can reopen a closed ticket if unresolved.

TICKET CREATION FORM (multi-step, all required unless noted)
Step 1 - Category (single-select): PC Issue, Laptop Issue, Printer Issue, Network Issue
Step 2 - Sub-option (single-select, options depend on category):
  PC Issue -> PC not booting, Power on no display, Hanging, Software issue
  Laptop Issue -> Laptop not booting, Power on no display, Hanging, Software issue
  Printer Issue -> Printing not coming, Print error, Scan problem, Software not working
  Network Issue -> Network not connecting, Network slow issue, Wifi not connect
Step 3 - Description (free text): "Describe the problem you are facing"
Step 4 - Asset ID or Contact Number (text, at least one of the two required)
Step 5 - Floor/Location (single-select, initially: 1st Floor, 2nd Floor; make this a DB
  lookup table so Admin can add more floors later, not hardcoded)
On submit, auto-generate: ticket code (e.g. TCK-2026-00001), created_at timestamp, raised-by
(from logged in client), and set status = "Open".

WORKFLOW / STATUS LIFECYCLE
Open -> Assigned -> In Progress -> Resolved/Closed -> (optionally Reopened -> In Progress again)
1. Client submits a ticket -> Super Admin is notified (in-app + email).
2. Admin opens the ticket, sees a list of engineers filtered by matching skill tag for
   the ticket's category (but can override and pick any engineer), assigns one ->
   status becomes "Assigned" -> assigned engineer is notified (in-app + email).
3. Engineer opens the ticket, sets status "In Progress", can comment back and forth with
   the client if more info is needed.
4. Engineer resolves the issue, fills the mandatory resolution form (resolution notes,
   root cause, time spent), status becomes "Resolved/Closed" -> client is notified.
5. Client can view the resolution; if not actually fixed, client can reopen the ticket,
   which notifies the engineer/admin and sets status back to "In Progress".

DATABASE SCHEMA
Tables: users (id, name, email, password_hash, role, phone, floor, is_active, created_at),
engineer_skills (id, user_id, skill), tickets (id, ticket_code, client_id, category,
sub_option, description, asset_id, contact_number, floor, priority, status,
assigned_engineer_id, created_at, assigned_at, resolved_at, closed_at),
ticket_resolution (id, ticket_id, engineer_id, resolution_notes, root_cause,
time_spent_minutes, closed_at), ticket_comments (id, ticket_id, user_id, message,
created_at), locations (id, name), notifications (id, user_id, ticket_id, message,
is_read, created_at).

PAGES
- Login page (single form, redirect by role after auth), forgot password
- Client: Dashboard (My Tickets by status tabs), Raise New Ticket (the multi-step form
  above), Ticket Detail (status timeline + comments)
- Super Admin: Dashboard (counts by status/category/priority), All Tickets (searchable/
  filterable table), Ticket Detail (assign engineer + set priority), Manage Users
  (create/edit/deactivate engineers & clients, assign skill tags), Manage Locations,
  Reports (avg resolution time, tickets per category, engineer workload)
- IT Engineer: Dashboard (My Tickets by status), Ticket Detail (update status, comment,
  close-with-resolution form)

NOTIFICATIONS
Implement in-app notifications (bell icon, unread badge, list, mark-as-read) using
polling or WebSockets (Socket.io). Also send emails via Nodemailer/SMTP on: ticket
created (to admin), ticket assigned (to engineer), ticket closed (to client), ticket
reopened (to engineer/admin).

NON-FUNCTIONAL
- Protect all API routes with JWT + role middleware so users only ever see data they're
  authorized to see (clients see only their own tickets, engineers see only assigned
  tickets, admin sees everything).
- Add basic validation (required fields, at least one of asset ID/contact number).
- Seed the database with one Super Admin, a couple of demo Engineers (with different
  skill tags), a demo Client, and the two floor locations, so the app is testable
  immediately after setup.
- Keep the UI clean and simple with Tailwind, a sidebar nav per role, and a status-badge
  color scheme (Open=gray, Assigned=blue, In Progress=yellow, Resolved/Closed=green,
  Reopened=red).

Build this step by step: 1) auth + roles, 2) DB schema + seed data, 3) client ticket
form + creation flow, 4) admin ticket list + assignment, 5) engineer ticket handling +
resolution form, 6) notifications, 7) dashboards/reports.
```

---

### Notes
- The floor list, engineer skill tags, and categories are all stored in editable lookup tables/settings rather than hardcoded, so Admin can extend them later (e.g., adding "3rd Floor" or a new category like "Software License Issue") without a code change.
- Priority isn't in your original list, but I added it as an optional Admin-set field — it makes triage much easier once ticket volume grows. Drop it from the prompt above if you don't want it.
