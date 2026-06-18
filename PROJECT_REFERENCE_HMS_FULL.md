# ITTravelers — Hotel Management System (HMS)
# Full Reference Document

**Built by:** Ahmed Shokry
**Date:** June 2026
**Live URL:** https://ittravelers-system.vercel.app/hms
**GitHub:** https://github.com/ashokryy1-hash/ittravelers-system

---

## TABLE OF CONTENTS

1. What Is the HMS and Why Was It Built
2. How the App Is Deployed and Where Code Lives
3. Environment Variables — What They Are and Where They Are Set
4. The Full Database — Every Table, Every Column, and Why It Exists
5. Every Screen — What It Does, Why It Was Built, Where the Code Is
6. The Season Detection System — How It Works End to End
7. The Activity Encoding Pattern — How Tour Data Is Stored
8. The Email System — How Templates Are Built and Logged
9. The WhatsApp Builder — How the Message Is Generated
10. Key Design Decisions and Why
11. If Something Breaks — How to Diagnose and Fix It
12. How to Add New Features Safely

---

## 1. WHAT IS THE HMS AND WHY WAS IT BUILT

The HMS is a second internal tool added to the ITTravelers platform. It sits at `/hms` inside the same React app as the Trip Explorer.

**Who uses it:** Only Ahmed (the agent). No client ever sees this screen.

**Why it was built:**
Before the HMS, managing bookings meant:
- Keeping hotel confirmations scattered across Gmail
- Tracking which hotels hadn't replied in a separate note
- Writing each hotel email from scratch every time
- Building WhatsApp tour programs manually in a text document
- No single view of what a client had confirmed

The HMS fixes all of this by giving one place where you can:
- See every booking per client
- Generate hotel emails with one click
- Know instantly which hotels haven't replied (Availability Pending = no reply)
- Build full multi-day tour itineraries and copy the WhatsApp message instantly
- Have pricing reflect the correct season automatically

---

## 2. HOW THE APP IS DEPLOYED AND WHERE CODE LIVES

### Where the code lives
- **GitHub repository:** `https://github.com/ashokryy1-hash/ittravelers-system`
- **Production branch:** `claude/epic-goldberg-xt4mj2`
  - This is the branch Vercel watches. Every push to this branch triggers a live deployment automatically.
  - Do NOT push to `main` or any other branch expecting it to go live — only this branch deploys.

### How a change goes live
```
You or Claude edits a file
      ↓
git add [file] → git commit → git push origin claude/epic-goldberg-xt4mj2
      ↓
Vercel detects the push automatically (no manual action needed)
      ↓
Vercel runs: npm run build (TypeScript check + Vite build)
      ↓
If build passes → site goes live in ~60 seconds
If build fails → Vercel keeps old version live, nothing breaks
```

### What Vercel does
Vercel is a hosting service. It watches your GitHub branch, rebuilds the app every time you push, and serves the compiled files to users. There is no server — it is a "static" site with a PostgreSQL database on Supabase.

### Where the live app is served from
- `ittravelers-system.vercel.app` → Trip Explorer (original app)
- `ittravelers-system.vercel.app/hms` → Hotel Management System

The `vercel.json` file in the project root tells Vercel to redirect all routes back to `index.html` (this is required for React Router to work — without it, refreshing `/hms/tours` would give a 404).

---

## 3. ENVIRONMENT VARIABLES — WHAT THEY ARE AND WHERE THEY ARE SET

The app needs 4 secret values to run. These are NOT stored in the code (that would be a security risk). They are stored in Vercel's dashboard.

| Variable | What It Is | Where to Find It |
|---|---|---|
| `VITE_SUPABASE_URL` | The address of your Supabase database | Supabase dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | The public key to read/write the database | Supabase dashboard → Project Settings → API → anon/public key |
| `VITE_ADMIN_PASSWORD` | Password for the Trip Explorer /admin panel | You set this, stored in Vercel |
| `VITE_CLAUDE_API_KEY` | Anthropic API key for AI features (draft email) | Anthropic console |

**Where to view/edit them:**
Vercel Dashboard → ittravelers-system project → Settings → Environment Variables

**Why these exist:**
The code file `src/lib/supabase.ts` reads `import.meta.env.VITE_SUPABASE_URL` — this is how Vite (the build tool) injects environment variables into the compiled code at build time. Without these values, the app cannot connect to the database and will show empty screens or errors.

---

## 4. THE FULL DATABASE — EVERY TABLE, EVERY COLUMN, AND WHY IT EXISTS

The database lives on Supabase (PostgreSQL). There are two sets of tables:
- **`explorer_*`** tables — for the original Trip Explorer (hotels/tours browser)
- **`hms_*`** tables — for the Hotel Management System

All `hms_*` tables were created by migration files in `supabase/migrations/`.

---

### `hms_hotels`
*Stores the hotels you have contracts with and use for client bookings.*

Migration: `supabase/migrations/006_hms_schema.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID, auto-generated |
| `name` | text | Hotel name shown everywhere |
| `destination_id` | uuid → `hms_destinations` | Links hotel to a destination (e.g. Bali) — needed for season detection |
| `city` | text | City/area name (e.g. Canggu, Ubud) |
| `star_rating` | int | For display |
| `contact_email` | text | Where availability request emails are sent |
| `reservation_email` | text | Separate email for confirmed bookings (some hotels have different addresses) |
| `surcharge_waiver` | text | `'none'` / `'50%'` / `'100%'` — some hotels waive the peak season surcharge as part of the contract |
| `contract_status` | text | Active / Expiring soon / Expired |
| `valid_from`, `valid_to` | date | Contract validity dates |
| `notes` | text | Internal notes about the hotel |

**Why `destination_id` matters:** The season detection system looks up surcharge rules by destination. If a hotel doesn't have `destination_id` set, the booking form will not detect the season correctly and will always show "Low Season."

---

### `hms_bookings`
*One row = one hotel reservation for one client.*

Migration: `supabase/migrations/006_hms_schema.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `client_name` | text | The client this booking belongs to. Used to group bookings into client folders. Editable after creation. |
| `hotel_id` | uuid → `hms_hotels` | Which hotel |
| `room_type` | text | Free text — room type name (e.g. "Garden Villa") |
| `checkin_date` | date | Check-in date |
| `checkout_date` | date | Check-out date |
| `pax` | int | Number of guests |
| `rate_per_night` | numeric | Rate in IDR per night — includes season surcharge if applicable |
| `status` | text | `'Availability pending'` / `'Confirmed'` / `'Paid'` / `'Cancelled'` |
| `surcharge_waiver` | text | `'none'` / `'50%'` / `'100%'` — overrides the hotel's default waiver for this specific booking |
| `notes` | text | Internal notes about this booking |
| `cutoff_date` | date | Option hold/cutoff date for the hotel |

**Why `client_name` is plain text and not a foreign key:**
Clients are not stored in a separate table. This was an intentional design choice — you don't register clients, you just type their name when making a booking. The client folder view is generated dynamically by grouping bookings with the same name (normalized to lowercase to handle slight spelling differences).

---

### `hms_booking_emails`
*Every email sent for a booking is logged here.*

Migration: `supabase/migrations/010_reservation_emails.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `booking_id` | uuid → `hms_bookings` | Which booking this email belongs to. Cascade delete: if booking is deleted, emails are deleted too. |
| `direction` | text | `'sent'` — currently all emails are sent (future: could track received replies) |
| `subject` | text | Email subject line |
| `body` | text | Full email body text |
| `sent_at` | timestamptz | When it was logged (when you clicked the button) |

**Why emails are logged:**
So you can always go back and see exactly what was sent to the hotel and when, without needing to search your Gmail. Also used to know if a reminder has already been sent.

---

### `hms_surcharge_rules`
*Defines which dates are High or Peak season and the surcharge amounts.*

Migration: `supabase/migrations/006_hms_schema.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `destination_id` | uuid → `hms_destinations` | Which destination these rules apply to (currently Bali) |
| `season_name` | text | e.g. "High Season 2026" or "Peak Season 2026" — if name contains "peak" it's treated as Peak, otherwise High |
| `start_date` | date | First day of this season |
| `end_date` | date | Last day of this season |
| `room_surcharge` | numeric | Extra amount in IDR per night for rooms during this season |
| `villa_surcharge` | numeric | Extra amount in IDR per night for villas during this season |

---

### `hms_tours`
*One row = one tour itinerary for one client.*

Migration: `supabase/migrations/015_tours.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `client_name` | text | Client name. Same as bookings — not a foreign key, just a text match to link tours to the same client |
| `pax` | int | Number of people |
| `notes` | text | Free text notes AND encoded contact details (see Section 7) |
| `created_at` | timestamptz | When it was created, used for ordering |

---

### `hms_tour_days`
*One row = one day inside a tour.*

Migration: `supabase/migrations/015_tours.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `tour_id` | uuid → `hms_tours` | Which tour this day belongs to. Cascade delete: deleting a tour deletes all its days. |
| `date` | date | The calendar date for this day (optional — can be left blank) |
| `sort_order` | int | Controls the order days are displayed (Day 1, Day 2, etc.) |

---

### `hms_tour_activities`
*One row = one activity line inside a day.*

Migration: `supabase/migrations/015_tours.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `day_id` | uuid → `hms_tour_days` | Which day this activity belongs to. Cascade delete: deleting a day deletes all its activities. |
| `time` | text | Time of the activity (e.g. "09:00", "TBC") — stored as text not a time type so it can hold "TBC" |
| `description` | text | The activity content. For a simple stop, this is plain text. For structured types (transfer, airport pickup/dropoff) it is encoded — see Section 7. |
| `sort_order` | int | Controls display order within the day |

---

### `hms_activity_templates`
*Saved reusable day programs shown in the Activity Library.*

Migration: `supabase/migrations/015_tours.sql`

| Column | Type | Why it exists |
|---|---|---|
| `id` | uuid | Unique ID |
| `name` | text | Template name (e.g. "Nusa Penida Full Day") |
| `icon` | text | Emoji icon shown next to the name |
| `activities` | jsonb | Array of activity objects: `[{"time": "09:00", "description": "..."}]` — stored as JSON because the number of activities per template varies |
| `created_at` | timestamptz | For ordering in the library list |

---

## 5. EVERY SCREEN — WHAT IT DOES, WHY IT WAS BUILT, WHERE THE CODE IS

### Navigation and Layout
**File:** `src/hms/HmsRoot.tsx`
**What it does:** The outer shell of the HMS. Contains the sidebar navigation with links to all HMS screens. All HMS screens are rendered inside this layout.
**Why it was built:** Keeps the HMS visually separate from the Trip Explorer. The sidebar shows: Dashboard, Discovery, Outreach, Rates, Reservations, Tours, Settings.

---

### Reservations Screen
**File:** `src/hms/screens/ReservationsScreen.tsx`
**Route:** `/hms/reservations`

**What it does:**
This is the main booking management screen. It has two views:
- **All Bookings (list view)** — every booking across all clients in chronological order
- **Client Folders (clients view)** — bookings grouped by client name, each client is a collapsible card

**Why the client folder view was built:**
Previously the list view showed all bookings without organization. When a client has 3 hotels booked, you had to scroll to find them. The folder view groups all of one client's bookings together — click the client's name to expand all their reservations.

**Why client name normalization matters:**
If a client is saved as "Yusuf El Sayed" in one booking and "yusuf el sayed" in another, they would appear as two separate folders. The code normalizes all names to `name.trim().toLowerCase()` before using them as the grouping key — so both appear in the same folder. The display name shown is whichever version was entered first.

**Why the booking form detects season automatically:**
Without this, you would have to manually check what season the check-in date falls in and calculate the surcharge yourself. The form watches the hotel and check-in date fields — as soon as both are set, it queries the surcharge rules, finds the matching season, shows a badge ("High Season"), and updates the rate field to include the surcharge. This happens in real time while you fill in the form.

**Why email templates are built into the form (not a separate screen):**
Because you generate the email right after reviewing the booking details. Having them on the same card means zero navigation — click the booking, see the email templates, click a template, copy, paste.

**Why the Reminder email shows for all Availability Pending bookings (not just ones you've emailed before):**
Originally the reminder button only showed if you had already sent an availability request email. This was changed because sometimes you send the email from Gmail directly and don't log it in the system — the hotel still hasn't replied and you still need a reminder. Now any booking with status "Availability Pending" shows the reminder button.

**Why you can edit the client name after creation:**
Typos happen. Also, sometimes you get a booking from "Ahmed" and only later get the full name "Ahmed Hassan". Rather than deleting and recreating the booking, you can click the name and edit it inline. All grouping updates automatically.

**Why delete requires two-step confirmation:**
Booking deletion is permanent and includes the email log. To prevent accidental deletion, the first click shows a "Confirm Delete?" button and only the second click actually deletes. This applies to cancelled bookings too — they are still deletable, just with the same safety step.

---

### Tours Screen
**File:** `src/hms/screens/ToursScreen.tsx`
**Route:** `/hms/tours`

**What it does:**
Two tabs:
- **Itineraries** — all tour programs organized by client or chronologically
- **Activity Library** — saved day templates you can insert while building a tour

**Why the New Tour form is a two-step flow:**

*Step 1 — Client Picker:*
You search and pick a client from the list of reservation clients (from `hms_bookings`). This means you don't type the client name from scratch — you pick the same name that's already in reservations, so the tour and reservations link up under the same client folder view. If the client is not in reservations yet, there is a "New client" option.

When you pick a client, their confirmed hotels (hotels with status Confirmed or Paid) appear as colored chips. This is the key connection between reservations and tours.

*Step 2 — Itinerary Builder:*
The selected client is shown at the top as a card. Their confirmed hotels appear throughout the form as quick-fill buttons — when adding an airport pickup, you click one of the confirmed hotel chips and it fills in the "Drop to hotel" field instantly instead of typing the full hotel name.

**Why there are 4 activity types instead of just a text field:**
Tour itineraries have structured data: transfers have a From and a To. Airport pickups have a flight number and a destination hotel. Airport drop-offs have a pickup hotel and a departure flight. If all of this was typed as free text, the WhatsApp message generator couldn't format it properly. By breaking it into typed activities, the system knows exactly what each piece means and can format it correctly in the WhatsApp output automatically.

**Why the Edit Tour button exists:**
After creating a tour, details often change — flight times get confirmed, hotel names get corrected, extra days get added. The pencil icon opens the same form pre-filled with the existing data so you can change anything and save.

**Why the WhatsApp message is generated automatically:**
Writing the WhatsApp message manually from the itinerary takes 10-15 minutes and introduces formatting errors. The `buildWhatsApp()` function reads all the tour data and formats it exactly right every time. Click the WhatsApp button, paste, send.

---

### Settings Screen
**File:** `src/hms/screens/SettingsScreen.tsx`
**Route:** `/hms/settings`

**What it does:**
Manage surcharge rules. Add, edit, and delete date ranges that define High and Peak seasons and their surcharge amounts.

**Why it's a separate screen instead of being hardcoded:**
Seasons change every year. Rather than editing code every time the new season dates are announced, you update them in the Settings screen and everything else (booking form, email templates) picks up the new values automatically.

---

### Rates Screen
**File:** `src/hms/screens/RatesScreen.tsx`
**Route:** `/hms/rates`

**What it does:**
Shows all contracted hotels with their room types and rates per season.

---

## 6. THE SEASON DETECTION SYSTEM — HOW IT WORKS END TO END

**File:** `src/hms/lib/season.ts`

This file contains 5 functions used throughout the HMS:

```
getSeasonForDate(date, rules)
  → Takes a single date and the list of surcharge rules
  → Checks if the date falls within any rule's start_date to end_date
  → If the rule's season_name contains "peak" → returns 'peak'
  → If it matches any other rule → returns 'high'
  → If no rule matches → returns 'low'
  → Also returns the matching rule object (needed to get the surcharge amount)

getSeasonForStay(checkin, checkout, rules)
  → Calls getSeasonForDate using the check-in date
  → Simplified rule: the check-in night determines the whole stay's season

getSurcharge(season, rule, category, waiver)
  → season: 'low' | 'high' | 'peak'
  → rule: the surcharge rule object (has room_surcharge and villa_surcharge)
  → category: 'room' or 'villa' (determines which surcharge amount to use)
  → waiver: 'none' | '50%' | '100%' (hotel contract may waive the surcharge)
  → Returns the surcharge amount in IDR to add to the rate

nightsBetween(checkin, checkout)
  → Returns the number of nights between two date strings
  → Used to calculate total price

seasonLabel(season)
  → 'peak' → 'Peak'
  → 'high' → 'High'
  → 'low' → 'Low'
  → Used in email templates and form badges
```

**The full flow from booking form to email:**

```
1. User selects hotel + check-in/out dates in the booking form

2. ReservationsScreen runs:
   getSeasonForStay(checkin, checkout, surchargeRules)
   → returns { season: 'high', rule: { room_surcharge: 450000, ... } }

3. Form shows badge: "High Season" in orange

4. Form calls getSurcharge('high', rule, 'villa', 'none') → 700000
   → Adds 700000 to the base room rate
   → Rate field updates to show base + surcharge

5. User saves the booking with the combined rate stored in rate_per_night

6. When generating an email template:
   → Template reads the saved rate_per_night
   → Calls getSeasonForStay again on the saved dates to get the season label
   → Email body includes: "Rate: IDR 3,500,000 per night (High Season)"
```

**Common issue:** If the season always shows "Low" even for dates that should be High, the most likely cause is that the hotel's `destination_id` is not set in the database. The surcharge rules are filtered by `destination_id` — if the hotel doesn't link to a destination, the query returns no rules and every date falls back to Low season.

**Fix:** Go to Supabase → `hms_hotels` table → find the hotel → set `destination_id` to the Bali destination UUID.

---

## 7. THE ACTIVITY ENCODING PATTERN — HOW TOUR DATA IS STORED

**Why this pattern was invented:**
The `hms_tour_activities` table has a single `description` text column. When the tours feature was first built, only simple text activities existed (e.g. "Jungle ATV — The Jungle Club Ubud"). Later, transfers (From → To), airport pickups (flight → hotel), and airport drop-offs (hotel → flight) were added. These have structured fields, not free text.

**The decision:** Rather than adding `from`, `to`, `flight` columns to the database (which would require migrations and could break existing data), the structured data is encoded inside the existing `description` column using a prefix pattern. This is the encoding format:

```
Simple stop:
  "Jungle ATV — The Jungle Club Ubud"
  (no prefix — plain text)

Transfer:
  "__transfer__:Teratai Villa Canggu|||Suara Alam Ubud, Ubud|||"
  format: __transfer__:FROM|||TO|||FLIGHT_NUMBER
  (flight number is empty string if not applicable)

Airport Pickup:
  "__airport-pickup__:Teratai Villa Canggu|||MS985"
  format: __airport-pickup__:DESTINATION_HOTEL|||FLIGHT_NUMBER

Airport Drop-off:
  "__airport-dropoff__:Suara Alam Ubud|||EK369"
  format: __airport-dropoff__:PICKUP_HOTEL|||FLIGHT_NUMBER

Contact details (stored in hms_tours.notes):
  "__contact__:Ahmed Mohamed|||+20 100 000 0000"
  (stored as the first line of the notes field)
```

**The separator `|||` was chosen** because hotel names can contain commas, dashes, and other common punctuation — `|||` is unlikely to appear in any hotel name.

**The two functions that handle this:**

```typescript
// In ToursScreen.tsx

encode(type, data)
  → Called when SAVING an activity
  → e.g. encode('airport-pickup', { to: 'Teratai Villa Canggu', flight: 'MS985' })
  → Returns: "__airport-pickup__:Teratai Villa Canggu|||MS985"

parseActivity(description)
  → Called when READING an activity from the database
  → Detects the prefix, splits on |||, returns { type, from, to, flight, text }
  → If no prefix found → returns { type: 'stop', text: description }
```

**What this means for you:** If you look directly at the `hms_tour_activities` table in Supabase and see entries like `__transfer__:...`, that is not a bug — that is intentional encoded data. The app decodes it automatically before displaying.

---

## 8. THE EMAIL SYSTEM — HOW TEMPLATES ARE BUILT AND LOGGED

**Where templates are defined:** Inside `ReservationsScreen.tsx` in the `buildEmailTemplate()` function.

**The 3 template types:**

**1. Availability Request** (`availability`)
Sent to the hotel's `contact_email` to ask if a room is available for the client's dates.
Contains: client name, hotel name, check-in, check-out, nights, room type, pax, rate with season note, cutoff date request, notes.

**2. Reminder** (`reminder`)
A shorter follow-up for hotels that haven't replied.
Contains: same info as availability request, with a note referencing the original inquiry.
Shown on: any booking with status "Availability Pending".

**3. Booking Confirmation** (`confirmation`)
Sent to the hotel's `reservation_email` to confirm the booking.
Contains: client name, hotel name, confirmation of dates, room type, pax, agreed rate, notes.

**How the email is generated:**
```
Click "Availability Request" button on a booking card
      ↓
buildEmailTemplate(booking, hotel, nights, season) runs
      ↓
Returns { subject: "...", body: "..." }
      ↓
Email appears in a text box below the booking card
      ↓
User clicks "Copy" → copies to clipboard → pastes into Outlook/Gmail
      ↓
supabase.from('hms_booking_emails').insert({ booking_id, subject, body, direction: 'sent' })
      ↓
Email logged under the booking with timestamp
```

**The email is NOT sent automatically.** It is generated, copied by you, and pasted into your email client. This was intentional — it gives you the chance to review and edit the email before sending. Future versions could send directly via the Outlook API (the `OUTLOOK_SENDER_EMAIL` and `OUTLOOK_SENDER_PASSWORD` environment variables already exist in Vercel for this purpose, used by the `api/send-email.ts` Vercel function).

---

## 9. THE WHATSAPP BUILDER — HOW THE MESSAGE IS GENERATED

**Where it lives:** The `buildWhatsApp(tour)` function in `ToursScreen.tsx`.

**What it does:**
Reads a full tour object (with all days and activities) and produces a formatted multi-line text string ready to send on WhatsApp.

**The output format:**
```
🌼🌼
Ahmed Hassan
+201003007740
2 pax

🌴
27 Jun 2026
22:25 - Flight no: EK398 🚗 Transfer: Airport → Teratai Villa Canggu
End of program

🌴
29 Jun 2026
15:00 🚗 Transfer: Teratai Villa Canggu → Finn's Beach Club
End of program
```

**How each activity type is formatted:**
- **Stop:** `{time} {description}`
- **Transfer:** `{time} 🚗 Transfer: {from} → {to}` (+ flight badge if present)
- **Airport Pickup:** `{time} ✈️ Airport Pickup: Flight {flight} → {to}`
- **Airport Drop-off:** `{time} 🛫 Airport Drop-off: {from} → Flight {flight}`

**How contact details get into the message:**
Contact name and phone are stored encoded in `tour.notes`. The `parseContact(notes)` function splits them out. If a contact name exists, it appears at the top of the message: `📞 Ahmed Mohamed — +20 100 000 0000`.

**How the WhatsApp button works:**
```
Click "WhatsApp" button
      ↓
buildWhatsApp(tour) generates the text
      ↓
navigator.clipboard.writeText(text) copies to clipboard
      ↓
Button turns green and shows "Copied!" for 2 seconds
      ↓
Paste into WhatsApp
```

---

## 10. KEY DESIGN DECISIONS AND WHY

**No separate Clients table**
Clients are identified by name only (in `hms_bookings.client_name` and `hms_tours.client_name`). There is no `hms_clients` table. This was chosen because:
- You don't need to "register" a client before making a booking
- Faster workflow — just type the name
- The client folder view is generated dynamically by grouping on the name
- Downside: if a name is spelled differently in two bookings, they appear as separate clients

**No separate column for structured activity data**
The `__type__:field1|||field2` encoding in `description` avoids database migrations every time a new activity type is added. It keeps the schema simple at the cost of readability in the raw database.

**Season detection uses check-in date only**
A stay could span Low and High season (e.g. check in on June 30, check out on July 3). The code uses only the check-in date to determine the season for the whole stay. This was a simplification — in practice, most hotels apply the surcharge based on check-in date.

**Email is generated but not auto-sent**
Emails are composed by the system and copied by you to paste into your email client. This gives you control to review and modify before sending. Auto-send via Outlook is architecturally ready (the server function `api/send-email.ts` exists) but not wired up to the reservation buttons.

**Cascade deletes**
All child records delete automatically when a parent is deleted:
- Delete a booking → its emails are deleted
- Delete a tour → its days are deleted → their activities are deleted
This prevents orphaned records in the database.

---

## 11. IF SOMETHING BREAKS — HOW TO DIAGNOSE AND FIX IT

### The app shows a blank white screen

**Cause:** Almost always a JavaScript error that crashes the React app.

**How to diagnose:**
1. Open the app in Chrome
2. Press F12 → click the Console tab
3. Look for red error text
4. The error message will tell you exactly what failed

**Common causes:**
- A new code push had a TypeScript error that Vercel didn't catch (shouldn't happen — Vercel runs `tsc` before deploying)
- A Supabase query is returning unexpected data format

---

### Data is not loading / screens show "Loading..." forever or blank

**Cause:** The app cannot reach the Supabase database.

**How to diagnose:**
1. F12 → Console → look for error messages like "Failed to fetch" or "Invalid API key"
2. F12 → Network tab → look for requests to `supabase.co` with red status codes

**Most likely fixes:**
- Environment variables are missing or wrong in Vercel → Vercel Dashboard → Settings → Environment Variables → check all 4 are set
- After changing environment variables in Vercel, you must trigger a new deployment (push any small change, or click "Redeploy" in Vercel)

---

### Season always shows "Low Season" even for July/August dates

**Cause:** The hotel's `destination_id` is not set.

**Fix:**
1. Go to `supabase.com` → your project → Table Editor → `hms_hotels`
2. Find the hotel
3. Copy the Bali destination's UUID from `hms_destinations` table
4. Paste it into the hotel's `destination_id` field
5. Save

---

### Client appears in two separate folders (duplicate)

**Cause:** The same client's name is spelled slightly differently across two bookings (e.g. "Ahmed Hassan" vs "ahmed hassan" vs "Ahmed  Hassan" with double space).

**Fix — Option A (in the app):**
Open one of the bookings → click the client name → edit it to match exactly → save. Repeat for all bookings until the name is consistent. The folders will merge.

**Fix — Option B (in Supabase):**
Go to Supabase → Table Editor → `hms_bookings` → find the bookings → update `client_name` directly.

---

### Tour activities show as raw encoded text (e.g. `__transfer__:Hotel A|||Hotel B|||`)

**Cause:** The `parseActivity()` function failed or was bypassed. The raw encoded string is showing instead of the decoded display.

**How to diagnose:**
1. F12 → Console → look for JavaScript errors
2. Check if it happens on all activities or just one type

**Most likely fix:**
This should not happen in normal operation. If it does, check `ToursScreen.tsx` to ensure `parseActivity(act.description)` is being called before rendering each activity.

---

### A Vercel deployment failed and the old version is still live

**This is actually safe** — Vercel keeps the last working version running when a build fails.

**How to see what went wrong:**
1. Go to Vercel Dashboard → your project → Deployments tab
2. Click the failed deployment
3. Click "View Build Logs"
4. Scroll to the bottom to see the TypeScript or build error

**Most common cause:**
A TypeScript type error (e.g. calling a function that doesn't exist, passing wrong data type). Fix the error in the code, push again, Vercel will try again.

---

### An email template is generating wrong rates or wrong season label

**Cause 1:** The surcharge rules in `hms_surcharge_rules` have wrong dates.
**Fix:** Go to HMS → Settings → check the season dates are correct.

**Cause 2:** The hotel's `surcharge_waiver` is set incorrectly.
**Fix:** Go to Supabase → `hms_hotels` → check the `surcharge_waiver` column for that hotel (`'none'`, `'50%'`, or `'100%'`).

**Cause 3:** The booking was saved before surcharge rules were added.
The rate stored in `rate_per_night` is what was calculated at the time of saving. If rules change after saving, old bookings are not retroactively updated — the email template uses the saved rate.

---

### "Cannot find module" error in build logs

**Cause:** A package is imported in the code but not installed.
This happened once with `date-fns` — it was imported in `ToursScreen.tsx` but missing from `package.json`.

**Fix:**
```
npm install [package-name]
git add package.json package-lock.json
git commit -m "Add missing package"
git push origin claude/epic-goldberg-xt4mj2
```

---

### Tours or bookings are not saving (no error shown)

**Cause:** A Row Level Security (RLS) policy is blocking the write. This can happen if you are not properly authenticated in Supabase.

**How to diagnose:**
F12 → Console → look for Supabase error messages about RLS or permissions.

**Fix:**
All `hms_*` tables have a policy: `FOR ALL TO authenticated USING (true)`. This means only authenticated users (logged-in users) can write. If you are somehow not authenticated (e.g. session expired), writes will silently fail.
The HMS uses Supabase's `anon` key (not the `service_role` key), so it respects RLS. In practice this is rarely a problem since the app runs in a browser session.

---

### Activity Library templates not showing when building a tour

**Cause:** The templates table is empty, or the query is failing.

**Fix — if table is empty:**
Run the SQL from `supabase/seed_library_templates.sql` in the Supabase SQL Editor to add the standard templates.

**Fix — if query is failing:**
F12 → Console → check for Supabase errors on the `hms_activity_templates` query.

---

## 12. HOW TO ADD NEW FEATURES SAFELY

### The development workflow

Always develop on the production branch `claude/epic-goldberg-xt4mj2`. This is safe because Vercel only deploys if the build passes — a broken change will not go live.

```
1. Make the code change
2. Run: npm run build
   → If this fails: fix the TypeScript error shown, then try again
   → If this passes: safe to push
3. git add [changed files]
4. git commit -m "clear description of what changed"
5. git push origin claude/epic-goldberg-xt4mj2
6. Wait ~60 seconds → check Vercel dashboard → verify deployment succeeded
7. Open the live app → test the new feature
```

### If you need to add a new database column

1. Write an SQL `ALTER TABLE` statement
2. Run it in Supabase SQL Editor (not a file — just run it directly)
3. Update the TypeScript types in `src/hms/types.ts` to include the new column
4. Update the Supabase queries in the relevant screen file to select the new column
5. Build and test

### If you need a new database table

1. Write a `CREATE TABLE` SQL statement
2. Add RLS policy: `CREATE POLICY "auth_all" ON [table] FOR ALL TO authenticated USING (true) WITH CHECK (true);`
3. Run it in Supabase SQL Editor
4. Save a copy as a new migration file: `supabase/migrations/016_[name].sql`
5. Add TypeScript types in `src/hms/types.ts`
6. Build the feature in the screen file

---

## QUICK REFERENCE — FILES AND WHAT THEY DO

```
src/hms/
├── HmsRoot.tsx                  Sidebar layout, navigation links for all HMS screens
├── types.ts                     All TypeScript data types (HmsBooking, HmsTour, etc.)
├── DashboardScreen.tsx          HMS home dashboard
├── DiscoveryScreen.tsx          Hotel discovery / outreach pipeline
├── OutreachScreen.tsx           Email outreach to hotels for contracts
├── RatesScreen.tsx              View contracted hotel room rates by season
├── RateViewerScreen.tsx         Detailed rate comparison view
├── ReservationsScreen.tsx       ★ Main reservations + email module
├── ToursScreen.tsx              ★ Tour itineraries + activity library
├── SettingsScreen.tsx           Manage surcharge rules
├── SalesPortalScreen.tsx        Client-facing sales view
└── lib/
    └── season.ts                ★ Season detection + surcharge calculation functions

supabase/migrations/
├── 006_hms_schema.sql           All core HMS tables (hotels, bookings, surcharge rules, etc.)
├── 010_reservation_emails.sql   Added hms_booking_emails table
├── 011_pramana_emails_...sql    Added reservation_email column to hms_hotels
├── 012_booking_cutoff_date.sql  Added cutoff_date column to hms_bookings
└── 015_tours.sql                Tours tables + activity library + seed templates

supabase/
└── seed_library_templates.sql   ★ Run this in Supabase SQL Editor to reset activity library
                                   (keeps Nusa Penida, adds Ahmed Hassan tour templates)
```

★ = files you are most likely to need to look at or edit

---

*Document created: June 2026*
*For the HMS module of ITTravelers — ittravelers-system.vercel.app/hms*
