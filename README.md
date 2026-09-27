# where2eat 🎡

Can't decide where your group should eat? Spin the wheel.

where2eat finds real restaurants, cafes, and fast food spots near your current
location and lets you spin a roulette wheel to randomly pick one — perfect for
settling the "where should we eat" debate at the office or with friends.

## Features

- **Uses your current location** via the browser Geolocation API, shows the
  detected address (reverse-geocoded via [Nominatim](https://nominatim.org)),
  and pulls nearby eating places from
  [OpenStreetMap](https://www.openstreetmap.org) (via the free Overpass API —
  no API key required, racing two independent mirrors for reliability).
- **Remembers your last location** in the browser, so if a fresh GPS fix ever
  fails, it falls back to where it found you last instead of a generic demo
  spot.
- **Spin to decide** — an animated wheel randomly picks one place from the
  nearby list.
- **Configurable** via the ⚙️ settings button:
  - Search radius (default 1000 m / 1 km)
  - Budget per person (default $10) and group size (default 4) — shown with
    your results as a reminder for the group
  - Place types to include (restaurant, fast food, cafe, bar/pub, food court)
  - Cuisine filter, built from whatever cuisines are actually nearby
- **Respin controls** — exclude the winner and spin again, or just spin fresh,
  without leaving the page.
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
2. `fetchNearbyRestaurants` queries the Overpass API for OSM nodes/ways
   tagged `amenity=restaurant|fast_food|cafe|bar|pub|food_court` within the
   configured radius, sorted by distance.
3. The list (capped to the 16 closest, for a legible wheel) feeds the
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
