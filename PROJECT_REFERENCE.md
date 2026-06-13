# ITTravelers — Trip Explorer
### Project Reference Document
**Built by:** Ahmed Shokry  
**Date:** June 2026  
**Live URL:** https://ittravelers-system.vercel.app  
**GitHub:** https://github.com/ashokryy1-hash/ittravelers-system

---

## What Is This Project?

A **web application** built for an Egyptian travel agency (ITTravelers) as an internal sales tool. Used during one-on-one client calls via screen share to browse Bali travel packages — destinations, hotels, and tours — with honeymoon couples in real time.

**The problem it solves:** Before this app, agents had to jump between PDFs, spreadsheets, and partner websites during calls. This app puts everything in one clean, fast, branded interface.

---

## Features

- Browse **Bali destinations → Cities → Hotels & Tours**
- **Hotel cards** with cover photos, star ratings, room types, and photo links
- **Tour cards** with category badges, cover photos, inclusions/exclusions toggle, up to 4 TikTok preview links
- **Category filter** for tours: Romantic, Adventure, Cultural, Nature, Water, Nightlife, Beach Club
- **Session selection** — add hotels and tours to a shortlist during the call (resets on refresh — intentional, no client data stored)
- **Admin panel** at `/admin` — password protected, full CRUD for destinations, cities, hotels, and tours without touching code
- **No prices shown anywhere** — discussed verbally during the call
- Two tour operators in the same database: Beyond Bali Tours + Exotic Paradise Bali
- Fully responsive, mobile-friendly design
- Custom brand colors: terracotta, ivory, gold, dusty rose

---

## Tech Stack

| Technology | Role | Why |
|---|---|---|
| **React 18** | Frontend UI framework | Industry standard, component-based, fast |
| **TypeScript** | Type-safe JavaScript | Catches bugs before runtime |
| **Vite** | Build tool & dev server | Fastest React setup available |
| **Tailwind CSS** | Styling | No custom CSS files needed, utility classes |
| **Supabase** | Database + API (PostgreSQL) | No backend server needed, free tier |
| **React Query (@tanstack/query)** | Data fetching & caching | Handles loading/error states automatically |
| **React Router v6** | Client-side navigation | Multi-screen app without page reloads |
| **Lucide React** | Icons | Clean, consistent icon set |
| **Vercel** | Hosting & deployment | Free, auto-deploys from GitHub in 30 seconds |
| **GitHub** | Version control | Code history, connects to Vercel |

---

## Database Structure (Supabase / PostgreSQL)

5 tables:

```
destinations        → Bali (country, cover photo, vibe description)
     ↓
cities              → Ubud, Seminyak, Canggu, Uluwatu, Nusa Penida,
                       Sanur, East Bali, Gili Trawangan, North Bali
     ↓
explorer_hotels     → 43 hotels (star rating, chain, room types, photos)
explorer_tours      → 68 tours (category, inclusions, exclusions, TikTok links)
tour_cities         → many-to-many: links tours to multiple cities
```

### Key SQL concepts used:
- `CREATE TABLE` with primary keys and foreign keys
- `ALTER TABLE` to add columns via migrations
- `INSERT`, `UPDATE`, `DELETE` statements
- `JSONB` columns for arrays (room types, inclusions, exclusions)
- Row Level Security (RLS) policies
- UUID primary keys

---

## Project File Structure

```
ittravelers-system/
├── src/
│   ├── components/
│   │   ├── TourCard.tsx        # Tour display card with inclusions toggle
│   │   └── HotelCard.tsx       # Hotel display card with cover photo
│   ├── screens/
│   │   ├── DestinationScreen   # Bali → city area cards
│   │   ├── AreaScreen          # Hotels + tours for a city
│   │   └── AdminScreen         # Full admin CRUD panel
│   ├── context/
│   │   └── SessionContext      # Client selection state (React Context)
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces for all data
│   └── lib/
│       └── supabase.ts         # Supabase client connection
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_add_cover_images.sql
│   │   ├── 003_hotel_cover_photos.sql
│   │   ├── 004_tour_enhancements.sql
│   │   └── 005_exotic_paradise_tours.sql
│   └── seed.sql
├── vercel.json                 # SPA routing fix for Vercel
└── .env                        # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_ADMIN_PASSWORD
```

---

## How the App Flows

```
User opens app
      ↓
DestinationScreen — shows Bali with city area cards
      ↓
Click a city (e.g. Ubud)
      ↓
AreaScreen — shows hotels + tours for that city
      ↓
Click heart ❤️ on hotel or tour → adds to session selection
      ↓
Session summary shows selected items (resets on refresh)
```

---

## Deployment Flow

```
Write/edit code locally
      ↓
git commit + git push → GitHub
      ↓
Vercel detects the push automatically
      ↓
Vercel builds and deploys in ~30 seconds
      ↓
Live at ittravelers-system.vercel.app
```

---

## Key Problems Solved During Build

| Problem | Solution |
|---|---|
| Invalid UUID syntax in seed data | Changed prefixes from `t/c/d` to valid hex `e/b/a` |
| 404 error on `/admin` route | Added `vercel.json` with SPA rewrite rule |
| Cover image column didn't exist | Ran `ALTER TABLE` migration in Supabase |
| Google Images URLs blocked | Switched to Unsplash direct URLs |
| Partner logo showing on tour links | Removed tour link buttons entirely from cards |
| Tour inclusions/exclusions display | Added expandable Details toggle to keep cards compact |

---

## What I Learned

- How to design and build a **full-stack web application** from scratch
- **Database design** — tables, relationships, foreign keys, migrations
- **React components** — building reusable UI pieces
- **TypeScript** — defining data shapes with interfaces
- **Supabase** — setting up a database without a backend server
- **Git & GitHub** — version control and code history
- **Vercel** — deploying and hosting a web app
- **Tailwind CSS** — building modern UI quickly
- **SQL** — INSERT, UPDATE, DELETE, ALTER TABLE, JSONB arrays
- How to iterate on a live product — adding features incrementally

---

## CV / Portfolio Description

### Option 1 — Short (for CV bullet point):
> Built a full-stack internal sales tool for a travel agency using React, TypeScript, Supabase, and Vercel. Features include a multi-screen destination browser, hotel and tour catalog with admin panel, session-based client shortlisting, and a PostgreSQL database with 68 tours and 43 hotels across 9 Bali destinations.

### Option 2 — Medium (for LinkedIn or portfolio):
> **ITTravelers Trip Explorer** — A production web application built for an Egyptian travel agency to use during client sales calls. The app allows agents to browse Bali destinations, hotels, and tours on screen share with clients in real time. Built with React, TypeScript, Vite, Tailwind CSS on the frontend, and Supabase (PostgreSQL) as the backend database. Deployed on Vercel with automatic GitHub integration. Features include a full admin panel for content management, category-based tour filtering, expandable inclusions/exclusions, and a session-based shortlist system. This was my first software project built from scratch.

### Option 3 — For portfolio website:
> **ITTravelers — Trip Explorer**
> My first full-stack web project. An internal sales tool for a travel agency.
>
> **Tech:** React · TypeScript · Tailwind CSS · Supabase · Vercel
>
> **Key features:** Multi-screen destination browser · 43 hotels · 68 tours from 2 operators · Admin CRUD panel · Session shortlist · Mobile responsive
>
> **Live:** ittravelers-system.vercel.app · **Code:** github.com/ashokryy1-hash/ittravelers-system

---

*Document created: June 2026*
