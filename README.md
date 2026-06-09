# ITTravelers — Trip Explorer

An internal sales tool for use during client calls. Browse Bali destinations, hotels, and tours on screen share, tick selections, and copy a clean summary to build the package in Henksh.

---

## How to set up (step by step)

### Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create a free account)
2. Click **New project**
3. Give it a name (e.g. `ittravelers`) and set a database password — save the password somewhere
4. Choose a region close to you and click **Create new project**
5. Wait ~2 minutes for it to set up

---

### Step 2 — Run the database migration

This creates all the tables the app needs.

1. In your Supabase project, go to **Database → SQL Editor** (left sidebar)
2. Click **New query**
3. Open the file `supabase/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents and paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)
6. You should see "Success. No rows returned."

---

### Step 3 — Run the seed data

This loads all Bali content: 1 destination, 9 areas, 43 hotels, 30 tours, and all tour-area mappings.

1. Still in **Database → SQL Editor**, click **New query** again
2. Open the file `supabase/seed.sql` from this project
3. Copy the entire contents and paste it into the SQL Editor
4. Click **Run**
5. You should see "Success. No rows returned."

---

### Step 4 — Get your Supabase credentials

1. In your Supabase project, go to **Project Settings → API** (gear icon in sidebar)
2. Copy your **Project URL** — looks like `https://xxxxxxxxxxxx.supabase.co`
3. Copy your **anon / public** key — long string starting with `eyJ...`

---

### Step 5 — Set up environment variables

1. In this project folder, copy the example file:
   ```
   cp .env.example .env
   ```
2. Open `.env` and fill in your values:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJyour-anon-key...
   VITE_ADMIN_PASSWORD=choose-a-password-for-admin
   VITE_CLAUDE_API_KEY=sk-ant-your-claude-api-key
   ```
   - `VITE_ADMIN_PASSWORD` — any password you choose for the `/admin` page
   - `VITE_CLAUDE_API_KEY` — your Anthropic API key (needed for PDF hotel extraction). Get one at [console.anthropic.com](https://console.anthropic.com)

---

### Step 6 — Run the app locally

Make sure you have Node.js installed (v18 or newer). Then:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deploy to Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New → Project** and import your GitHub repo
4. Under **Environment Variables**, add the same four variables from your `.env` file
5. Click **Deploy**

Vercel auto-deploys on every push to main. Your app will get a URL like `ittravelers.vercel.app`.

---

## How the app works

- **/** — Home screen with Bali (live) + Thailand/Vietnam (coming soon)
- **/bali** — Bali destination overview with area tabs
- **/bali/:areaId** — Hotel and tour cards for that area
- **/summary** — Everything you've ticked, grouped by area, with copy button
- **/admin** — Password-protected admin panel

**Selections are session-only** — they reset when you refresh the page. This is intentional.

---

## Admin panel features

- **Hotels tab** — Add, edit, delete hotels. Upload a hotel contract PDF and the Claude AI will extract all properties for you to review before saving.
- **Tours tab** — Add, edit, delete tours. Assign each tour to one or more areas.
- **Areas tab** — Add or edit areas/cities.

---

## Notes

- No prices are shown anywhere in the app
- TikTok and Photos buttons only appear if a URL is stored for that hotel/tour
- The app is read-only for visitors — all data changes happen in the admin panel
