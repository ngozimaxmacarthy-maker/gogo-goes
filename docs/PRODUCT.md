# Gogo Goes: product foundation

Group travel for the road less traveled. First users: Ngozi and friends.
First live trip: Ananya & Tyler's honeymoon.

## The shape

One app, two modes, joined by one moment.

| | Plan mode (from `v0-ngozi-travel-mvp`) | Trip mode (from `v0-ghana-trip-dashboard`) |
|---|---|---|
| Who | Every traveler takes the survey; the planner arranges | Everyone |
| Core | Recommendations, shelf, drag onto days | Today's plan, flights, payments |
| Data | `Experience`, `PlanItem`, interest profiles | Same `PlanItem`s, plus `Expense`, `Flight` |

**Lock the plan** is the explicit switch from planning to live (`trip.status`:
`planning → locked → live → done`).

## Decisions

- **Experience is the shared unit.** Plan and Trip mode point at the same
  record, so costs, dress codes and booking warnings flow through automatically.
- **Modular = movable + switchable.**
  - Movable: a `PlanItem` is just experience + day + slot + order. `dayIndex: null`
    is the shelf. `lib/plan.ts#moveItem` handles every move.
  - Switchable: `trip.modules` (itinerary, payments, flights, logistics, packing,
    outfits, journal). Payments and flights are general modules.
- **Tags are AI-suggested, curator-approved.** Only `approved` tags affect
  recommendations. Experiences stay unpublished until reviewed.
- **Taxonomy** (`lib/taxonomy.ts`): 25 survey interests in 5 groups (up from 7),
  plus curator-only dimensions: offbeat level (1–5), energy, emotional weight,
  physical intensity, group fit, time of day, logistics flags (cash only,
  needs driver, low connectivity, rainy season…) and ownership (community-owned).
- **Recommender** (`lib/recommend.ts`): per-traveler affinity from approved tags,
  occasion boosts (honeymoon → romance), offbeat fit vs. each traveler's
  adventurousness, then a least-misery group blend (60% mean, 40% minimum).
  Penalties for off-season, wrong group size and budget.
- **Learning signal**: `experience_events` is append-only (recommended,
  shortlisted, scheduled, removed, attended, skipped, rated). Logged from day
  one; used for ranking once there's enough of it.
- **Payments** (`lib/split.ts`): weighted shares, per-expense FX to the trip's
  base currency (cedis, CFA…), greedy settle-up.

## Stack

- Next.js on Vercel (Hobby plan today).
- Postgres via Drizzle (`db/schema.ts`, migration in `db/migrations`).
  Recommended host: **Supabase** from the Vercel Marketplace, free tier.
  It brings auth, realtime (several people dragging on one plan) and storage
  (photos) in one place. The schema is plain Postgres, so Neon also works.

## Next up

1. Provision Supabase, set `DATABASE_URL`, run `npm run db:migrate`, seed.
2. Survey flow (port from the travel MVP onto the new taxonomy).
3. Planner: shelf + days, drag to move, live warnings from `planWarnings`.
4. Curator queue: AI tag suggestions → approve/reject.
5. Import from Viator / Booking into the queue.
6. Lock → Trip dashboard: itinerary, flights, payments.
7. Flight tracking job (needs a flight-status API key).
