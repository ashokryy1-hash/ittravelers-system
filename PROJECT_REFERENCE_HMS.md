# ITTravelers — Hotel Management System (HMS)

**Project Reference Document**

**Built by:** Ahmed Shokry
**Date:** June 2026
**Live URL:** https://ittravelers-system.vercel.app/hms
**GitHub:** https://github.com/ashokryy1-hash/ittravelers-system

---

## What Is This Module?

An internal **Hotel Management System** added to the ITTravelers platform as a second major module (alongside the Trip Explorer). It is used exclusively by the agent — no clients ever see it.

**The problem it solves:** Managing hotel reservations for multiple clients meant tracking everything manually across WhatsApp, Gmail, and spreadsheets. Chasing hotels that hadn't replied, remembering who was confirmed, building tour itineraries per client — all scattered. The HMS puts all of that in one place: reservations, email templates, tour itineraries, and client files.

---

## What the HMS Contains

### 1. Reservations
Track every hotel booking for every client. Each booking stores the hotel, room type, check-in/out dates, number of guests, status, and rate. Bookings are organized into client folders so you can see all of one client's hotels at a glance.

### 2. Tours
Build multi-day tour itineraries for clients. Each tour has days with activities — tour stops, transfers between hotels, airport pickups, and airport drop-offs. Generates a formatted WhatsApp message automatically. Templates of common day programs can be saved and reused.

### 3. Settings
Manage seasonal surcharge rules (Low / High / Peak season) with date ranges and surcharge amounts per room and villa. These feed automatically into booking rates and email templates.

---

## Features

### Reservations Module
- **Client folder view** — bookings grouped by client name, click a folder to expand all their bookings
- **List view** — all bookings chronologically across all clients
- **New booking form** with:
  - Client name with autocomplete from existing clients
  - Hotel dropdown (from HMS hotels list)
  - Room type, check-in / check-out dates, number of guests
  - Season auto-detection — detects High / Peak / Low season from surcharge rules and shows a badge; applies the surcharge to the rate automatically
  - Rate field pre-filled based on season
  - Status selector: Availability pending / Confirmed / Paid / Cancelled
  - Surcharge waiver selector: None / 50% / 100%
  - Notes field
- **Editable client name** — rename a client on any booking after creation; all folder grouping updates automatically
- **Delete booking** — two-step confirm; works for any status including Cancelled
- **Email templates** — one click generates a ready-to-copy hotel email:
  - *Availability Request* — asks the hotel to confirm room availability and rates
  - *Reminder* — follow-up for hotels that have not replied (shows for all Availability Pending bookings)
  - *Booking Confirmation* — sends confirmed reservation details to the hotel
  - All templates are **season-aware** — show the correct rate and include a season note (High / Peak) when applicable
- **Email log** — each sent email is recorded with timestamp and template type; viewable per booking

### Tours Module
- **Client folder view** — tours grouped by client name, same pattern as reservations
- **List view** — all tours across all clients
- **New Tour — 2-step flow:**
  - **Step 1: Client picker** — searchable list of clients pulled from the Reservations module (hms_bookings), showing each client's confirmed hotels as chips. "New client" option for clients not yet in reservations.
  - **Step 2: Itinerary builder** — selected client shown as a card with their confirmed hotels. Build days with activities.
- **4 activity types** (click to cycle through):
  - 🏖 **Tour Stop** — free text description (e.g. "Jungle ATV — The Jungle Club Ubud")
  - 🚗 **Transfer** — From hotel → To hotel, with hotel dropdown and confirmed-hotel quick-fill chips
  - ✈️ **Airport Pickup** — Arrival flight number + destination hotel with quick-fill chips
  - 🛫 **Airport Drop-off** — Pickup hotel with quick-fill chips + departure flight number
- **Time field** on every activity
- **Contact details** — contact name and phone stored per tour, shown in WhatsApp output
- **Notes** field appended at the bottom of the WhatsApp message
- **Edit tour** — pencil icon opens a pre-filled edit modal; change any field, add/remove days and activities, save
- **Delete tour** — single confirm
- **WhatsApp message builder** — auto-generates a formatted multi-day itinerary message, copy with one click

### Activity Library
- Save reusable day programs (e.g. "Nusa Penida Full Day", "Jungle ATV Ubud", "Elephant Safari")
- Each template has an icon, name, and list of activities with times
- **Edit template** inline — pencil icon expands the card into edit mode; add/remove activities, save
- Apply a template to any day while building a tour

### Settings
- Manage **seasonal surcharge rules** — each rule has a name, date range (start/end), room surcharge amount, and villa surcharge amount
- Season names: rules containing "peak" are treated as Peak season; others are High season; no matching rule = Low season
- Rates in the booking form and email templates update automatically based on these rules

---

## Tech Stack

| Technology | Role | Why |
|---|---|---|
| React 18 | Frontend UI framework | Same as Trip Explorer, consistent codebase |
| TypeScript | Type-safe JavaScript | Catches bugs before runtime |
| Vite | Build tool & dev server | Fastest React setup |
| Tailwind CSS | Styling | No custom CSS files needed |
| Supabase | Database + API (PostgreSQL) | No backend server needed |
| TanStack Query | Data fetching & caching | Handles loading/error/refetch automatically |
| Lucide React | Icons | Clean, consistent icon set |
| date-fns | Date formatting | Format tour day dates cleanly |
| Vercel | Hosting & deployment | Auto-deploys from GitHub |
| GitHub | Version control | Code history, connects to Vercel |

---

## Database Structure

8 new tables added to Supabase (all prefixed `hms_`):

```
hms_hotels            → Hotel list (name, city, contact email, reservation email,
                         star rating, surcharge_waiver, destination_id)

hms_bookings          → One row per booking
                         (client_name, hotel_id FK, room_type, checkin, checkout,
                          pax, rate, status, surcharge_waiver, notes, cutoff_date)

hms_booking_emails    → Email log per booking
                         (booking_id FK, template_type, sent_at, subject, body)

hms_surcharge_rules   → Seasonal pricing rules
                         (season_name, start_date, end_date,
                          room_surcharge, villa_surcharge)

hms_tours             → One row per client tour
                         (client_name, pax, notes)
                         notes field encodes contact: __contact__:name|||phone

hms_tour_days         → One row per day in a tour
                         (tour_id FK, date, sort_order)

hms_tour_activities   → One row per activity in a day
                         (day_id FK, time, description, sort_order)
                         description field encodes structured types (see below)

hms_activity_templates → Saved reusable day programs
                         (name, icon, activities JSONB)
```

### Activity Encoding Pattern

Because the database `description` column is plain text, complex activity types are encoded inline using a prefix pattern — no schema changes needed to add new types:

```
Tour Stop:        "Jungle ATV — The Jungle Club Ubud"
                  (plain text, no prefix)

Transfer:         "__transfer__:Teratai Villa Canggu|||Suara Alam Ubud|||"
                  format: __transfer__:from|||to|||flight

Airport Pickup:   "__airport-pickup__:Teratai Villa Canggu|||MS985"
                  format: __airport-pickup__:to|||flight

Airport Dropoff:  "__airport-dropoff__:Suara Alam Ubud|||EK369"
                  format: __airport-dropoff__:from|||flight

Contact (in notes): "__contact__:Ahmed Mohamed|||+20 100 000 0000"
```

The `parseActivity()` function decodes all types on read. The `encode()` function encodes on write. This means zero database migrations were needed for any new activity type.

---

## Project File Structure (HMS portion)

```
src/
└── hms/
    ├── screens/
    │   ├── ReservationsScreen.tsx   # Reservations module (bookings, emails, client folders)
    │   ├── ToursScreen.tsx          # Tours module (itineraries, activity library)
    │   └── SettingsScreen.tsx       # Surcharge rules management
    ├── lib/
    │   └── season.ts                # Season detection logic
    │                                #   getSeasonForDate()   — matches date to surcharge rule
    │                                #   getSeasonForStay()   — uses check-in date
    │                                #   getSurcharge()       — calculates surcharge with waiver
    │                                #   nightsBetween()      — calculates stay length
    └── types/
        └── index.ts                 # TypeScript interfaces for all HMS data types
                                     #   HmsBooking, HmsHotel, HmsSurchargeRule,
                                     #   HmsTour, HmsTourDay, HmsTourActivity, etc.
```

---

## How the Reservations Flow Works

```
Agent opens Reservations tab
      ↓
Choose view: Client Folders or All Bookings list
      ↓
Click "+ New Booking"
      ↓
Select hotel → room type → check-in/out dates
      ↓
System auto-detects season from surcharge rules → shows badge → applies rate
      ↓
Fill pax, rate (pre-filled), status, notes → Save
      ↓
Booking appears in client folder
      ↓
Click booking to expand → Email Templates section appears
      ↓
Choose template (Availability Request / Reminder / Confirmation)
      ↓
System generates email with hotel name, dates, rate, season note
      ↓
Copy → paste into email client → send to hotel
      ↓
Email logged under the booking with timestamp
      ↓
Update booking status when hotel replies (Confirmed / Paid / Cancelled)
```

---

## How the Tours Flow Works

```
Agent opens Tours tab
      ↓
Click "+ New Tour"
      ↓
STEP 1 — Client Picker:
  Search reservation clients list
  Select client → see their confirmed hotels as chips
  OR choose "New client" for a non-reservation client
      ↓
STEP 2 — Itinerary Builder:
  Client card shows confirmed hotels for quick-fill
  Add contact name + phone number
  Add days with a date each
  For each day, add activities:
    → Stop: free text
    → Transfer: From hotel → To hotel (with confirmed hotel chips)
    → Airport Pickup: flight number → drop-off hotel
    → Airport Drop-off: pickup hotel → flight number
  Optionally apply saved template to a day
  Add notes
      ↓
Click "Create Tour" → saved to database
      ↓
Tour card shows in list with WhatsApp preview
      ↓
Click WhatsApp button → formatted message copied to clipboard
      ↓
Paste into WhatsApp → send to client
      ↓
Click pencil to edit any part of the tour later
```

---

## Season Detection Logic

```
hms_surcharge_rules table:
  season_name = "High Season Jul–Aug"  → treated as High
  season_name = "Peak Season Dec–Jan"  → treated as Peak (name contains "peak")
  No matching rule                     → Low season

On booking form:
  User selects hotel + check-in date
  → getSeasonForStay(checkin, checkout, rules) runs
  → Returns { season: 'high' | 'peak' | 'low', rule }
  → Badge shown: "High Season" / "Peak Season" / "Low Season"
  → Surcharge added to rate if season is not Low

On email template:
  → Template reads the saved rate
  → getSurcharge() recalculates the season label
  → Email body includes: "Rate: IDR 3,500,000 (High Season)"
```

---

## Key Problems Solved During Build

| Problem | Solution |
|---|---|
| Season always showing "Low" even for High/Peak dates | `destination_id` was missing from the hotel join in the bookings query — added it so surcharge rule matching worked |
| Duplicate client folders (same client, slight name variation) | Normalized group key: `name.trim().toLowerCase()` — display name kept as original |
| Email rate not reflecting season | Template was reading rate before season detection completed — fixed by detecting season at form-level and encoding it with the booking |
| `encodeTransfer` function referenced but deleted | Complete rewrite of `NewTourModal` save logic to use new unified `encode(type, data)` function |
| Tours modal showing old clients only | Switched client source from `hms_tours` to `hms_bookings` — now shows all reservation clients |
| `date-fns` import error at build | Package was imported in ToursScreen but not installed — ran `npm install date-fns` |
| Wrong branch pushed to Vercel | Vercel watches `claude/epic-goldberg-xt4mj2` — all pushes now target that branch |

---

## What Was Built (Chronological)

1. **HMS skeleton** — navigation, layout, routing, base screens
2. **Reservations** — booking form, hotel list, status management
3. **Client folder view** — grouped by client with expandable cards
4. **Email templates** — availability request, confirmation, with copy button
5. **Reminder email** — shows for all Availability Pending bookings
6. **Editable client name** — inline edit with save on any booking card
7. **Delete booking** — two-step confirm, including cancelled bookings
8. **Client autocomplete** — datalist from existing client names on new booking form
9. **Season detection** — surcharge rules table, season badge on form, season note in emails
10. **Tours module v1** — basic tour with transfer type, WhatsApp output
11. **Tours client folder view** — same pattern as reservations
12. **4 activity types** — stop, transfer, airport-pickup, airport-dropoff with encoding pattern
13. **New Tour 2-step flow** — client picker from reservations → itinerary builder
14. **Confirmed hotel chips** — quick-fill buttons for airport and transfer activities
15. **Edit Tour modal** — pencil icon, pre-filled, full day/activity editing
16. **Activity Library editing** — inline edit mode for saved templates
17. **Activity Library seeding** — SQL script to add Ahmed Hassan tour templates

---

## CV / Portfolio Description

**Option 1 — Short (CV bullet point):**
> Extended a production travel agency web app with a full Hotel Management System module built in React, TypeScript, and Supabase. Features include a reservation tracker with client folder view, season-aware email templates, multi-type tour itinerary builder with WhatsApp output, and a two-step client picker connected to the reservations database.

**Option 2 — Medium (LinkedIn / portfolio):**
> ITTravelers HMS — An internal hotel reservation and tour management system added to a live travel agency platform. Allows the agent to track hotel bookings per client with status management, generate ready-to-send hotel emails that reflect seasonal pricing automatically, and build multi-day tour itineraries with four activity types (tour stops, transfers, airport pickups, airport drop-offs). Tours pull confirmed hotel data from reservations for quick-fill. Generates formatted WhatsApp itinerary messages with one click. Built with React, TypeScript, TanStack Query, Supabase, and Tailwind CSS.

---

*Document created: June 2026*
*HMS added to: ITTravelers Trip Explorer — ittravelers-system.vercel.app*
