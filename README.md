# Playground 🎵🎨🎬⚡

> **Where everyone is an Artist or Bettor.**
> Create music, video, and digital art. Predict outcomes. Tip creators. Play mini games. Earn Vibe Points.

---

## Features

### 🎨 As Artist
- Publish **Releases** — music, video, digital art — with YouTube/SoundCloud links
- Auto-extract cover thumbnail from YouTube URL
- Open **Prediction Markets** on your releases
- Receive **Tips** (Vibe Points) from fans

### 🎯 As Bettor
- Browse the **Home Feed** filtered by trending, latest, following, or type
- **Predict** outcomes on open markets with VP wager — see live odds before betting
- **Tip** any release you love
- Win proportional share of the pool on correct predictions

### 🎮 Mini Games (earn VP daily)
| Game | Reward | Limit |
|------|--------|-------|
| Daily Check-in 🔥 | 10–60 VP (streak bonus, max day 7) | 1×/day |
| Spin Wheel ⚡ | 5–200 VP (weighted, jackpot possible) | 1×/day |
| Vibe Quiz 🧠 | 5–30 VP (5 questions × 5 VP + bonus) | 2×/day |
| Guess The Track 🎵 | 20–40 VP (audio ID + speed bonus) | 3×/day |

### 👤 Profile
- Artist/bettor public profile with releases, stats, follower count
- VP transaction history (full audit ledger — own profile only)
- Follow/unfollow artists
- Settings: display name, bio, YouTube channel, SoundCloud username

### 🏆 Leaderboard
- Global ranking by Vibe Points balance with top-3 podium display

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Server Components) |
| Language | TypeScript (strict) |
| Database | Supabase Postgres (RLS + Postgres functions) |
| Auth | Supabase Auth (Email + Google OAuth) |
| Storage | Supabase Storage (cover images) |
| Styling | Tailwind CSS + custom design tokens |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Deployment | Vercel |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/               # Auth pages (no BottomNav)
│   │   ├── layout.tsx        # Auth layout with bg glows
│   │   ├── login/page.tsx    # Email + Google OAuth
│   │   └── register/page.tsx # 3-step registration wizard
│   ├── (main)/               # Main app (with BottomNav)
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Home Feed
│   │   ├── create-release/
│   │   ├── markets/          # Market list
│   │   ├── mini-games/       # All 4 games
│   │   ├── leaderboard/
│   │   ├── settings/
│   │   └── profile/[username]/
│   ├── markets/[id]/         # Market detail (full-screen)
│   └── auth/callback/        # OAuth callback
├── components/
│   ├── layout/    TopBar, BottomNav
│   ├── feed/      HomeFeed, ReleaseCard, TipModal, FeedFilters
│   ├── release/   CreateReleaseForm
│   ├── market/    MarketCard, MarketDetailClient, BetModal
│   ├── minigame/  MiniGamesClient, SpinWheel, DailyCheckin, DailyQuiz, GuessTheTrack, VPToast
│   ├── profile/   ProfileClient, SettingsClient
│   └── shared/    Leaderboard
├── lib/
│   ├── supabase/  client.ts, server.ts
│   ├── actions/   auth.ts, vibe-points.ts, mini-games.ts, market.ts, release.ts, profile.ts
│   └── utils/     index.ts
├── types/         database.ts
└── middleware.ts  (route protection)

supabase/
└── migrations/
    ├── 001_schema.sql                  # Tables + RLS
    └── 002_vibe_points_functions.sql   # Atomic Postgres functions
```

---

## Supabase Setup

### 1. Create project

Go to [supabase.com](https://supabase.com) → New project.

### 2. Run migrations

In **SQL Editor**, run both migration files in order:

```bash
# Via Supabase CLI (recommended)
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Or paste each `.sql` file manually into the SQL Editor.

### 3. Create Storage bucket

**Storage → New bucket**:
- Name: `release-covers`
- Public: ✅

Add RLS policies for the bucket:

```sql
create policy "Auth users can upload covers"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'release-covers');

create policy "Public read covers"
  on storage.objects for select to public
  using (bucket_id = 'release-covers');
```

### 4. Enable Google OAuth (optional)

**Authentication → Providers → Google**:
1. Enable Google
2. Add Client ID + Secret from Google Cloud Console
3. Add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

In Google Cloud Console → OAuth 2.0 Credentials:
- Authorized JavaScript origins: `http://localhost:3000`, `https://your-domain.com`
- Authorized redirect URIs: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 5. Disable email confirmation for development

**Authentication → Settings → Email Auth → Confirm email: OFF**

---

## Environment Variables

Create `.env.local` at project root:

```env
# Supabase — found in Dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...   # safe for browser
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...       # PRIVATE — server only

# App URL — used for OAuth redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.** It bypasses all RLS.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy and fill env file
cp .env.local.example .env.local

# Run dev server
npm run dev          # → http://localhost:3000

# Type checking
npm run type-check
```

---

## Deploy to Vercel

### Via Dashboard

1. Push to GitHub/GitLab
2. **vercel.com → Add New Project → Import repo**
3. Add all 4 environment variables
4. Set `NEXT_PUBLIC_APP_URL` to `https://your-project.vercel.app`
5. **Deploy** ✅

### Via CLI

```bash
npm i -g vercel
vercel login
vercel --prod

# Add env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

### Post-deploy checklist

- [ ] Update `NEXT_PUBLIC_APP_URL` to actual Vercel URL
- [ ] Add Vercel domain to Supabase **Auth → URL Configuration → Redirect URLs**: `https://your-project.vercel.app/auth/callback`
- [ ] Update Google OAuth authorized origins + redirect URIs
- [ ] Enable email confirmation (if desired for production)

---

## Architecture Notes

### Vibe Points — Race-condition safe

All VP mutations use atomic Postgres functions (never direct `UPDATE`):

```
Server Action → supabase.rpc('place_prediction')
  → BEGIN
      SELECT ... FOR UPDATE     ← row lock
      CHECK balance ≥ wager     ← raises exception if insufficient
      UPDATE profiles.vibe_points
      INSERT point_transactions  ← immutable ledger
      INSERT predictions
      UPDATE markets.total_pool
    COMMIT
```

Key functions in `002_vibe_points_functions.sql`:

| Function | Purpose |
|----------|---------|
| `mutate_vibe_points` | Generic earn/spend |
| `send_tip` | Atomic: sender deduct + artist credit + tip row |
| `place_prediction` | Deduct + insert prediction + update pool |
| `resolve_market` | Proportional winnings distribution |
| `record_mini_game` | Rate-limited game reward (enforces daily limits) |
| `daily_checkin` | Streak-based reward with duplicate prevention |

### Routing strategy

- `(auth)` group — login/register without BottomNav
- `(main)` group — all authenticated/public app pages with BottomNav
- `markets/[id]` — outside `(main)` for full-screen layout
- Middleware protects `/create-release`, `/mini-games`, `/settings`, `/leaderboard`

---

## Vibe Points Reference

| Event | Change |
|-------|--------|
| Sign up | +100 VP |
| Daily check-in Day 1–7 | +10 / +15 / +20 / +25 / +30 / +40 / +60 VP |
| Spin Wheel — common | +5–20 VP |
| Spin Wheel — jackpot | +200 VP |
| Vibe Quiz — correct answer | +5 VP |
| Vibe Quiz — perfect 5/5 | +5 bonus VP |
| Guess The Track — correct | +20 + 0–20 speed bonus |
| Tip sent | −amount |
| Tip received (artist) | +amount |
| Prediction placed | −wagered |
| Prediction won | +floor(pool × wager / winning_pool) |

**Payout formula:**
```
payout = floor(total_pool × your_wager / total_bet_on_winning_option)
```
