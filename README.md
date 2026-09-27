# where2eat 🎡

Can't decide where your group should eat? Spin the wheel.

where2eat finds real restaurants, cafes, and fast food spots near your current
location and lets you spin a roulette wheel to randomly pick one — perfect for
settling the "where should we eat" debate at the office or with friends.

## Features

- **Uses your current location** via the browser Geolocation API, shows the
  detected address (reverse-geocoded via [Nominatim](https://nominatim.org)),
  and pulls nearby eating places from
  [OpenStreetMap](https://www.openstreetmap.org) — no API key required.
  Queries two independent Overpass mirrors in parallel, and if Overpass is
  entirely unreachable on a given network, falls back to a Nominatim POI
  search (separate OSM infrastructure) before finally falling back to demo
  data.
- **Remembers your last location** in the browser, so if a fresh GPS fix ever
  fails, it falls back to where it found you last instead of a generic demo
  spot.
- **Spin to decide** — an animated wheel randomly picks one place from the
  nearby list.
- **Configurable** via the ⚙️ settings button:
  - Search radius (default 1000 m / 1 km)
  - Budget per person (default $10) and group size (default 4) — shown with
    your results as a reminder for the group
  - Place types to include (restaurant, fast food, cafe, bar/pub, food court —
    all on by default)
  - Max places on the wheel (default 16), and whether the cut is by
    **nearest** (default) or **highest rated** — rating data is sparse in
    OSM, so unrated places just fall back to nearest
  - Cuisine filter, built from whatever cuisines are actually nearby
- **Respin controls** — exclude the winner and spin again, or just spin fresh,
  without leaving the page.
- **Permanent blacklist** — tap 🚫 next to any place to remove it from the
  wheel for good; it's remembered in the browser, so it stays excluded on
  future visits too. Blacklisted places that are still in range show in a
  collapsed "Not included in this spin" list, one tap away from being added
  back.
- **Graceful fallbacks** — if location access is denied, or live map data
  can't be reached, the app falls back to your last known location and/or
  demo restaurants so it's still usable to try out.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in a browser. Geolocation requires either
`localhost` or HTTPS, and the browser will prompt for location permission.

```bash
npm run build   # production build
npm run lint    # oxlint
```

## Deployment

This is a static site (no backend), deployed on [Cloudflare
Pages](https://pages.cloudflare.com/) via its Git integration:

1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Pages →
   Connect to Git**, authorize GitHub, and pick this repo.
2. Framework preset: **Vite** (or manually set build command `npm run build`
   and build output directory `dist`).
3. Production branch: `claude/restaurant-roulette-app-4ydckv`.

Cloudflare then builds and deploys automatically on every push, at a
`*.pages.dev` URL (custom domains can be attached afterward).

## How it works

1. `useGeolocation` asks the browser for your current coordinates.
2. `fetchNearbyPlaces` (in `api/places.ts`) tries Overpass first (queries two
   mirrors in parallel for OSM nodes/ways tagged
   `amenity=restaurant|fast_food|cafe|bar|pub|food_court` within the
   configured radius). If both mirrors are unreachable, it falls back to a
   single Nominatim search instead. If that also comes up empty, the caller
   falls back to demo data.
3. `mergeFoodCourtStalls` collapses individual food court stalls (OSM often
   maps each one as its own `fast_food`/`restaurant` node) into a single
   entry for the food court itself, labeled with how many stalls it has -
   otherwise one food court could flood the wheel with what's really the
   same destination.
4. The list (capped to the 16 closest, for a legible wheel) feeds the
   `RouletteWheel`, which spins to a uniformly random winner.
4. The winner is shown with a link to open it in Google Maps.

## Known limitations & ideas for later

- **Budget filtering isn't real yet.** OpenStreetMap's price-level data is
  too sparse to filter on reliably, so budget is currently just displayed
  alongside results. Wiring up a provider with real price levels (e.g.
  Google Places `price_level`, or Yelp) would make this an actual filter.
- **Group size** is informational only, for the same reason — there's no
  reliable "good for groups of N" signal in OSM data.
- Other ideas worth adding: saving favorite/blacklisted places, a shared
  "vote" mode so a group can veto results together, opening hours awareness
  (skip places that are closed right now), and a PWA manifest so it installs
  like an app on phones.
