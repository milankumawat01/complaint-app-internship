# Complaint App — What You Are Building

**Backend internship project** · Nov 25, 2026 · @Vivek Goyal

You are building the backend (the server and APIs) of a complaint and cleaning management app, from scratch, in FastAPI + PostgreSQL. There are 154 APIs to build between 26 Nov and 17 Dec 2026. Your daily tasks are already in the TVI app under the project `complaint-app-internship`.

## 1. What this software is

Think of a big building: a housing society, mall, hospital or office. Things break (a tap leaks, a light stops working) and areas need cleaning every day. This software helps the building's manager track all of that in one place, instead of paper registers and WhatsApp messages.

It answers three questions for the manager:

- **Complaints:** what broke, who is fixing it, is it fixed?
- **Cleaning:** did the cleaner really clean their area on time? (They upload before/after photos, and AI scores how clean it is.)
- **Store:** who took which materials (soap, phenyl, bulbs) from the store?

Three kinds of people use it:

| Who | Uses what | What they do |
| --- | --- | --- |
| Admin (building manager) | Web admin panel | Adds staff and areas, assigns work, checks photos, manages the store |
| Staff (cleaner, plumber, electrician) | Mobile app | Sees their tasks, uploads photos, fixes complaints, asks for materials |
| Resident (people living/working there) | Website | Files a complaint, tracks it, rates the work |

It is for one organisation only (not a SaaS for many companies). There is an old version of this app built in Next.js; you are building the new backend cleanly from scratch.

## 2. How it works — the three main flows

Almost every API you build is one step in one of these three stories.

### A. A complaint (something is broken)

1. Resident fills a form: "Tap leaking in Block B". The app gives a complaint number, e.g. 1001.
2. Admin sees it as unassigned and assigns it to a plumber.
3. Plumber sees it in the app and taps Start. The resident gets a secret OTP.
4. Plumber fixes the tap, asks the resident for the OTP, and enters it to close the complaint. (OTP proves the resident agrees it is fixed.)
5. Resident rates the work 1–5 stars.

Status moves: `PENDING` → `ASSIGNED` → `IN_PROGRESS` → `COMPLETED`.

### B. A daily cleaning task

1. Admin creates the places: Location ("Tower A") → Sub-location ("Floor 2 washroom").
2. Admin creates a task template ("Washroom cleaning") and time slots ("Morning 6–8 AM").
3. Admin assigns: this cleaner + this washroom + this slot + this date.
4. Cleaner opens the app, taps Start, takes a BEFORE photo, cleans, takes an AFTER photo (with GPS location).
5. The backend sends both photos to AI. AI gives a score 1–100.
6. A rule decides what happens: e.g. 80–100 = auto complete, 50–79 = admin reviews, below 50 = rejected, cleaner must redo.

### C. Asking for materials from the store

1. Admin adds products ("Phenyl, litre") and adds stock ("+20 litres").
2. Cleaner requests "2 litres phenyl" from the app.
3. Admin accepts or rejects (with a reason), then issues it.
4. Stock goes down by 2, and a ledger entry records who took what and when.

Around these three: notifications (push / WhatsApp / email when something happens), a dashboard with numbers, Excel exports, and a small form builder.

## 3. What you build

You build only the backend: the APIs that the admin panel, the staff mobile app and the resident website will call. No UI.

| Part | Use |
| --- | --- |
| Language | Python 3.12 |
| Framework | FastAPI + Pydantic v2 |
| Database | PostgreSQL 16 + SQLAlchemy 2.0 + Alembic (migrations) |
| Login | JWT tokens; passwords and OTPs hashed with bcrypt |
| Tests | pytest |
| Run locally | Docker Compose (API + Postgres) |
| Code | [github.com/milankumawat01/complaint-app-internship](https://github.com/milankumawat01/complaint-app-internship) |

The 154 APIs are split into 11 modules. Build them in this order; each one only needs the ones before it.

| # | Module | APIs | In one line |
| --- | --- | ---: | --- |
| 1 | Auth | 8 | Admin login with password; staff and resident login with OTP |
| 2 | Admin users & settings | 8 | Manage admins; global settings (shifts, GPS on/off) |
| 3 | Staff & professions | 13 | Add and manage cleaners, plumbers, electricians |
| 4 | Locations & time slots | 16 | Buildings, floors/areas, shift slots |
| 5 | Complaints | 23 | Flow A above |
| 6 | Task templates & assignments | 14 | Flow B, steps 1–3 |
| 7 | Task execution, photos, AI | 13 | Flow B, steps 4–6 |
| 8 | Inventory & material requests | 27 | Flow C |
| 9 | Notifications & banners | 14 | Push / WhatsApp / email |
| 10 | Dashboards & exports | 6 | Numbers for the admin home page, Excel downloads |
| 11 | Forms, contact, files, health | 12 | Small extras |

Every module uses the same folder layout:

```text
app/
  core/                  # config, database, security, common helpers
  modules/
    complaints/
      models.py          # database tables
      schemas.py         # request/response shapes
      service.py         # logic
      router.py          # thin API endpoints that call services
    staff/
      ...                # same four files
  main.py
alembic/
tests/
```

## 4. Main tables

You will create these tables module by module (one Alembic migration each time). Every table also has `id`, `created_at`, and `updated_at`.

| Table | Key columns | Belongs to flow |
| --- | --- | --- |
| admins | email, password_hash, role (super_admin / admin), is_active | — |
| settings | gps_mandatory, complaint_number_start, shift times, auto_accept_requests (one row) | — |
| events (audit log) | who, action, entity, entity_id, data | all |
| professions | name | — |
| staff | name, age, contact, email, profession_id, status | all |
| staff_otps / resident_otps | otp_hash, expires_at, attempts | login |
| residents | mobile, name, email, block | A |
| complaint_types | name | A |
| complaints | number, name, contact, block, type_id, description, status, staff_id, otp_hash, started_at, completed_at, rating | A |
| locations | name, lat, long, is_active | B |
| sub_locations | location_id, name, floor, block, area_type | B |
| time_slots | label, start_time, end_time | B |
| task_templates | name, area_type, is_active | B |
| task_assignments | template, staff, location, sub_location, slot, date, status | B |
| task_executions | assignment_id, status, started_at, completed_at | B |
| task_images | execution_id, type (BEFORE/AFTER), file_key, lat, long | B |
| ai_score_rules | min_score, max_score, action | B |
| ai_analyses | execution_id, score, summary, rule_id, status | B |
| units, products | name, unit, min_stock, image | C |
| inventory | product_id, quantity | C |
| inventory_transactions (ledger) | product_id, qty, type (ADD/ISSUE/ADJUST), staff_id, note | C |
| material_requests | staff, product, requested_qty, issued_qty, status, reject_reason | C |
| devices, notification_templates | push tokens, message templates, send log | all |
| notifications, banners | — | extras |
| forms, form_responses | JSONB fields/data | extras |
| contact_messages | — | extras |

The old app's table design is in `prisma/schema.prisma` of the old repo. Use it as a hint, but follow this list where they differ.

## 5. Rules you must follow

The old app had serious security bugs. Your code is not done if it breaks any of these rules.

1. Every API needs login, except the public ones marked Public (complaint form, OTP send/verify, contact form, health). Check the role too: a staff token must not open admin APIs.
2. Staff and residents only see their own data. If staff #5 asks for staff #6's complaint, return 404.
3. Never send an OTP or password back in a response. Store OTPs hashed (bcrypt), valid for 5 minutes, max 5 wrong tries, max 3 sends per 10 minutes.
4. No secrets in code. Keys and passwords go in `.env`. Commit only `.env.example` with empty values.
5. If one action writes to two or more tables, use one DB transaction. Example: issuing material = reduce stock + add ledger row + update request status — all three succeed or none.
6. Clean errors. Return a short JSON message like `{"detail": "Staff not found"}`. Never show SQL errors or stack traces.
7. Uploads: only JPEG/PNG/WebP, max 5 MB, check the real file type, never SVG.

An API is done when it shows in Swagger (`/docs`), has request and response schemas, and has 3 tests — one success, one bad input, one wrong user or no token.

## 6. Your schedule and daily routine

Every day has 8 hours of tasks in the TVI app (project `complaint-app-internship`, assigned by Milan). The last task each day is "Tests + bug fixes" to finish and clean up.

| Dates | You build |
| --- | --- |
| 26–27 Nov | Project setup, database, login core, first auth APIs |
| 28 Nov – 1 Dec | Admins, settings, audit log, staff, locations, time slots |
| 2–4 Dec | Complaints (flow A) |
| 4–5 Dec | Task templates and assignments (flow B, part 1) |
| 7–9 Dec | Task photos, GPS, AI scoring (flow B, part 2) |
| 9–11 Dec | Store and material requests (flow C) |
| 12–14 Dec | Notifications and banners |
| 14–16 Dec | Dashboards, Excel exports, forms, small extras |
| 16–17 Dec | Security check, speed check, deploy to staging, handover |

Every day:

1. Open today's tasks in the TVI app and start the timer on the first one.
2. Each API task has 3 subtasks: Planning (read the line, decide table + request + response), Making (write the code), Testing (write the 3 tests, try it in Swagger). Tick each one.
3. Tick the task when the API works and its tests pass.
4. Before you leave, push your code to the GitHub repo. The daily "Push Code to GitHub" task ticks itself when your push is found.
5. If you are stuck for more than 30 minutes, ask Milan instead of losing the day.

## 7. Where to look and who to ask

| What | Where |
| --- | --- |
| Your daily tasks | TVI app → My Tasks, project `complaint-app-internship` |
| Full API list (all 154, grouped) | Compliant Backend — API List |
| Your code repo | [github.com/milankumawat01/complaint-app-internship](https://github.com/milankumawat01/complaint-app-internship) |
| Old app (reference only, don't copy code) | [github.com/goyalvivek7/compliantsoftware](https://github.com/goyalvivek7/compliantsoftware), branch `latest`. See `prisma/schema.prisma` for tables and `src/app/api/` for old APIs |
| FastAPI basics | [fastapi.tiangolo.com/tutorial](https://fastapi.tiangolo.com/tutorial) |
| Your mentor | Milan Kumawat |

Start on 26 Nov with the first task: project setup. Get Docker Compose up and running and `/docs` opening in the browser. Everything after that is adding one API at a time.
