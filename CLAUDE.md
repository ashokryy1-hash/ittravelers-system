# ITTravelers HMS — Project Brief

## What This Is
An internal Hotel Management System (HMS) for ITTravelers — a Cairo-based honeymoon travel agency. Private web app requiring login to access.

## Tech Stack
- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Hosting:** Vercel (auto-deploys on every git push)
- **WhatsApp:** Green API (sends automated WhatsApp messages)
- **Server functions:** Vercel API routes in `/api/*.ts`
- **Data fetching:** React Query (@tanstack/react-query)

## Git
- **Repo:** ashokryy1-hash/ittravelers-system
- **Branch:** claude/epic-goldberg-xt4mj2
- Always commit and push to this branch after every change

## Modules Built
- **Dashboard** — overview stats
- **Leads & CRM** (`src/hms/screens/LeadsScreen.tsx`)
  - Honeymoon leads + Group Trip leads (two separate tabs)
  - WhatsApp automation via Green API (`/api/send-whatsapp.ts`)
  - Pipeline stages: New → Contacted → Replied → Meeting → Proposal Sent → Booked → Lost
  - Priority tags: 🔥 Hot / 🌱 Warm / ❄️ Cold / ⏸ On Hold
  - Trip Library for group trips with seat counter and departure countdown
- **Rates** (`src/hms/screens/RatesScreen.tsx`) — hotel room rates, seasons, surcharges
- **Reservations** (`src/hms/screens/ReservationsScreen.tsx`) — bookings management
- **Outreach** (`src/hms/screens/OutreachScreen.tsx`) — hotel outreach pipeline
- **Tours** (`src/hms/screens/ToursScreen.tsx`) — itinerary builder with Bali templates
- **Settings** (`src/hms/screens/SettingsScreen.tsx`) — exchange rates, API keys, meeting links
- **Sales Portal** — PIN-protected page for sales team to check rates (5% markup on IDR prices)

## Database Migrations
All migrations in `/supabase/migrations/` (001–018).
Pending — must be run in Supabase SQL Editor:
- `017_trips_and_lead_types.sql` — creates hms_trips table, adds lead_type + trip_id to hms_leads
- `018_lead_priority.sql` — adds priority column to hms_leads

## Critical Rules — Never Break These
1. **No email ever sends without explicit user click on Send** — applies to every module
2. All API keys server-side only — never use `VITE_` prefix for secrets
3. Green API env vars: `GREEN_API_INSTANCE_ID`, `GREEN_API_TOKEN` (set in Vercel dashboard)
4. Sales portal shows IDR prices with 5% markup only — hotel NET rates never visible to sales team
5. Login required to access any HMS route

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- `VITE_ADMIN_PASSWORD` — HMS login PIN (currently 2605)
- `GREEN_API_INSTANCE_ID` — set in Vercel only (never in .env)
- `GREEN_API_TOKEN` — set in Vercel only (never in .env)

## About the User
Ahmed is the Operations Manager at ITTravelers, Cairo. Non-technical background.
- Always explain what SQL does before running it
- Keep explanations simple and in plain English
- The agency specializes in honeymoon packages — Bali, Thailand, Maldives, Vietnam
