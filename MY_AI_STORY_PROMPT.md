# My AI-Assisted Development Story — Prompt for AI Tools

---

Use this prompt when talking to any AI (ChatGPT, Claude, Gemini, etc.) to get
help writing your CV, LinkedIn profile, portfolio, cover letters, or interview prep.

---

## THE PROMPT

---

I am a travel agent / business owner who had zero programming experience.
Between May and June 2026, I built two fully working, production web applications
from scratch using AI as my coding partner and teacher. I want you to help me
communicate what I built, what I learned, and how I did it — for my CV,
LinkedIn, and portfolio.

---

### CONTEXT — WHO I AM

My name is Ahmed Shokry. I run an Egyptian travel agency called ITTravelers,
specialising in honeymoon packages to Bali, Indonesia. Before this project, my
workflow was: PDFs, spreadsheets, WhatsApp messages, and memory. I had never
written a single line of code.

---

### WHAT I BUILT

I built two interconnected systems under one codebase, deployed live on the internet:

---

#### SYSTEM 1 — Trip Explorer App
**Live URL:** https://ittravelers-system.vercel.app

A client-facing sales tool used during one-on-one calls with honeymoon couples.
Instead of jumping between PDFs and partner websites, I now share my screen
and navigate one clean branded app in real time with the client.

**What it does:**
- Browse Bali destinations → cities → hotels and tours in a guided flow
- 43 hotels displayed with cover photos, star ratings, room types, and photo gallery links
- 68 tours displayed with category badges (Romantic, Adventure, Cultural, Nature,
  Water, Nightlife, Beach Club), inclusions/exclusions toggle, and up to 4 TikTok preview links
- Two tour operators in the same database: Beyond Bali Tours + Exotic Paradise Bali
- Session-based shortlist — add hotels and tours during the call, resets on refresh
  (intentional: no client data is ever stored)
- No prices shown anywhere — discussed verbally during the call
- Password-protected Admin Panel at /admin — full CRUD for all destinations,
  cities, hotels, and tours without touching any code
- Fully responsive design with custom brand colors: terracotta, ivory, gold, dusty rose

---

#### SYSTEM 2 — Hotel Management System (HMS)
**Live URL:** https://ittravelers-system.vercel.app/hms

An internal operations tool used exclusively by me (never shown to clients).
Before this, I tracked all hotel reservations, client itineraries, and hotel
emails across WhatsApp, Gmail, and Excel. The HMS replaced all of that.

**What it does:**

**Reservations Module:**
- Every hotel booking for every client stored in one place
- Client folder view (click a client name → see all their bookings)
- New booking form with: client name autocomplete, hotel dropdown, room type,
  check-in/out dates, guests, season auto-detection (Low/High/Peak), rate
  pre-filling, status tracking, surcharge waiver, and notes
- Season rules engine — I defined date ranges and surcharge amounts; the app
  automatically detects what season a booking falls in and applies the correct rate
- Three one-click email templates per booking:
  - Availability Request (ask the hotel if the room is free)
  - Reminder (follow-up for hotels that haven't replied)
  - Booking Confirmation (send the hotel the final confirmed details)
  All templates are season-aware — they include the correct rate and season note automatically
- Email log per booking — every sent email recorded with timestamp

**Tours Module:**
- Build multi-day tour itineraries for clients
- Client picker pulls from the Reservations module — shows each client's
  confirmed hotels as quick-fill chips
- Four activity types per day: Tour Stop (free text), Transfer (hotel to hotel),
  Airport Pickup, Airport Drop-off
- Auto-generates a formatted WhatsApp itinerary message — copy with one click
- Activity Library — save reusable day programs (e.g. "Nusa Penida Full Day",
  "Jungle ATV Ubud") and apply them to any new tour in one click

**Rates & Discovery Module:**
- Store partner hotel rates per room type and season
- Outreach pipeline — track which hotels I've contacted, their response status,
  and next follow-up actions
- Sales portal — upload a hotel's PDF contract, extract the rates using AI,
  and store them automatically

**Settings:**
- Manage surcharge rules (season name, date range, surcharge amount per room/villa)
- These rules feed all other modules automatically

---

### HOW I BUILT IT — THE PROCESS

I built everything through conversation with AI (Claude Code). I never opened a
code editor myself. The process looked like this:

1. **I described a problem** in plain English (e.g. "I need a way to track which
   hotels I've emailed and what I asked them")
2. **The AI designed the solution** — database table, UI components, user flow
3. **I reviewed the result** in my browser and gave feedback
4. **We iterated** — "the email template needs to show the rate after the surcharge
   is applied, not before" → the AI updated the logic
5. **I approved and we moved to the next feature**

Every feature started as a real business pain I felt, not a technical exercise.
The AI translated my operational knowledge into working software.

---

### WHAT I LEARNED

Even though I didn't write the code myself, I now understand:

**Concepts I can explain and reason about:**
- How a React app is structured (components, screens, routing, state)
- What TypeScript is and why type safety catches bugs before users see them
- What a database is, what tables and relationships mean, what a foreign key does
- What SQL is — I can read INSERT, SELECT, ALTER TABLE statements and understand them
- What Supabase is and how it replaces a traditional backend server
- What Row Level Security (RLS) means and why it matters for data access control
- What an API is — how the frontend asks the database for data
- What serverless functions are and how email sending works (Nodemailer, Vercel)
- What a migration is and why you don't edit the database directly in production
- What version control (Git/GitHub) is and why it matters
- What deployment means and how Vercel auto-deploys from GitHub in 30 seconds
- What JSONB columns are and when to use them for flexible data (arrays in a cell)
- What React Query does — caching, loading states, background refetching

**Soft skills I developed:**
- Translating a business problem into a technical requirement
- Reading code written by AI and understanding it well enough to catch mistakes
- Debugging by describing symptoms clearly ("the rate shows 0 when season is Peak")
- Breaking a large feature into small deliverable steps
- Knowing when a solution is over-engineered vs. right-sized for the problem

---

### TECH STACK USED

| Technology | Role |
|---|---|
| React 18 | Frontend UI framework |
| TypeScript | Type-safe JavaScript |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Supabase | PostgreSQL database + Auth + Storage |
| TanStack Query (React Query) | Data fetching and caching |
| React Router v6 | Client-side navigation |
| Vercel Serverless Functions | Backend API routes (email sending) |
| Nodemailer | Transactional email |
| React Hot Toast | Toast notifications |
| date-fns | Date calculation and formatting |
| Lucide React | Icon library |
| Vercel | Hosting and CI/CD |
| GitHub | Version control |

**Database:** PostgreSQL with 15 migrations, 12+ tables covering destinations,
hotels, tours, bookings, email logs, rate rules, outreach pipeline, activity library

---

### THE NUMBERS

- **2 production systems** built and deployed
- **1 shared codebase** (monorepo)
- **15 database migrations** written
- **12+ database tables** designed
- **43 hotels** and **68 tours** loaded
- **~6 weeks** from zero to production
- **0 prior coding experience**

---

### HOW TO USE THIS PROMPT

Tell the AI what you need:

- "Write a CV bullet point for this experience"
- "Write a LinkedIn About section based on this"
- "Write a portfolio project description for the Trip Explorer App"
- "Write a portfolio project description for the HMS"
- "Help me answer the interview question: tell me about a project you're proud of"
- "Write a cover letter paragraph about my technical skills based on this"
- "Suggest what job titles I could apply for given this experience"
- "What skills from this project are most valuable to employers?"

---
