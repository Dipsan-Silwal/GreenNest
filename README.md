# GreenNest — Smart Gardening E-Commerce & Plant Care Management System

A working demo web app built from the GreenNest project proposal (Dipsan Silwal, Dept. of CSIT, Tribhuvan University).
Plain HTML/CSS/JavaScript demo with an optional Node.js + MySQL API for shared persistent data.

## How to run it

1. Unzip this folder.
2. Double-click `index.html` to open it in your browser (Chrome, Edge, or Firefox recommended).
3. Click through the nav: **Home → Shop → Plant Quiz → Companion Planner → Dashboard → Experts**.
4. Use the **"Customer view ▾"** switcher in the top-right of the nav to jump to the **Expert Panel** or **Admin Panel** — these are separate, role-based screens matching the three system modules in the proposal.

State (cart, wishlist, plants, journal, orders, bookings) is saved in the browser's local storage, so it survives page reloads. Keep an internet connection open for Google Fonts and the live weather API on the Dashboard; the site still works offline, just with fallback system fonts and a "weather unavailable" message.

## MySQL database API

The original localStorage demo remains available, while `server.js` provides a MySQL-backed API for multi-device persistence.

1. Install Node.js 18+ and MySQL 8+.
2. Create the database and seed demo accounts: `mysql -u root -p < database.sql`.
3. Copy `.env.example` to `.env` and set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
4. Install packages with `npm install`.
5. Start the API and static site with `npm start`.
6. Open `http://localhost:3000`.

Available API routes include `GET /api/health`, `POST /api/auth/login`, `GET/POST/PATCH /api/products`, `POST /api/wallet/top-up`, and `POST /api/orders`. Protected routes use the authenticated user's numeric database id in the `x-user-id` header. The current pages still use localStorage until they are migrated to these endpoints, so existing demos do not break while the database layer is introduced.

## Pages

| Page | Proposal module | What it does |
| --- | --- | --- |
| `index.html` | Introduction / Overview | Landing page, problem statement, quick links |
| `shop.html` | Customer — marketplace | Product and flower inventory, filter + search, cart, wishlist |
| `quiz.html` | Smart Plant Recommendation | 5-question quiz, scores real products, adds to cart |
| `companion.html` | Companion & Seasonal Recommendations | Compatibility checker + season-by-season plant picks |
| `dashboard.html` | Customer — dashboard / journal | My Plants, growth timeline, **live weather-based reminders**, wishlist, orders, bookings |
| `experts.html` | Customer — expert booking | Browse 6 experts, book a slot, manage your bookings |
| `expert-panel.html` | Expert module | Accept/reject booking requests, weekly schedule view |
| `admin.html` | Admin module | Manage products, experts, appointments, orders; generate CSV reports |

## What's genuinely functional (not just static mockups)

- **Cart & checkout** — persists across every page, real quantity controls, checkout clears cart into an order history
- **Wishlist** — heart-toggle on any product, visible from the dashboard
- **Plant Quiz** — an actual scoring algorithm against the product catalog, not a canned result
- **Companion Planner** — real compatibility logic (good/bad pairings) and season-based filtering
- **Weather reminders** — calls the free [Open-Meteo](https://open-meteo.com) API live, using your browser's geolocation (falls back to Kathmandu), and generates watering/heat/rain alerts from the actual forecast
- **Growth journal** — add plants, log care notes, see a visual timeline of activity
- **Expert bookings** — a booking form writes into local storage; the **Expert Panel** reads the same data and lets you accept/reject it, so you can demo the full request → response loop
- **Admin inventory** — add flowers, update stock, remove products, and export the live inventory as CSV; changes persist in the browser and appear in Shop

## How to customize / re-edit

Everything is organized so a specific change lives in one obvious place:

- **Colors & fonts** → `css/style.css`, section `1. DESIGN TOKENS` at the top. Change the CSS variables (`--forest`, `--moss`, `--gold`, etc.) and the whole site updates — no need to touch individual pages.
- **Products, experts, companion data** → `js/data.js`. Built-in products are defined in the `PRODUCTS` array; admins can add flowers and manage stock from `admin.html`, with inventory saved in browser local storage.
- **Cart / wishlist / booking logic** → `js/main.js`. All shared behavior (add to cart, toggle wishlist, place order, book an expert) lives here so it's consistent across pages.
- **Page-specific layout/behavior** → each `.html` file has its own `<style>` block (page-only CSS) and `<script>` block (page-only logic) near the bottom, clearly separated from the shared files.
- **Responsive layout** → grids use `repeat(auto-fit, minmax(...))` instead of fixed column counts, so cards reflow naturally at any window width without needing extra breakpoints. If you add a new grid, follow the same pattern (see `.product-grid`, `.expert-grid`, etc. for examples).

## Honest scope notes

The browser demo still uses localStorage for its existing screens. The optional MySQL API is now available for shared users, inventory, wallet balances, and orders; frontend migration to the API can happen route by route. Demo passwords in `database.sql` are intentionally simple and must be replaced with hashed authentication before production use.

## Tech used

HTML5, CSS3, vanilla JavaScript — matching the frontend layer named in the proposal (HTML5 / CSS3 / Bootstrap-equivalent / JavaScript). No frameworks, no build tools, nothing to install.

## Folder structure

```text
GreenNest/
├── index.html            Landing page
├── shop.html              Marketplace
├── quiz.html               Plant recommendation quiz
├── companion.html          Companion & seasonal planner
├── dashboard.html          Customer dashboard + weather + journal
├── experts.html            Expert directory + booking
├── expert-panel.html       Expert role: manage requests
├── admin.html               Admin role: manage platform + reports
├── css/
│   └── style.css           Shared design system (read the comments — sectioned 1-11)
├── js/
│   ├── data.js              Sample products, experts, companion/season data
│   └── main.js               Shared cart / wishlist / journal / booking logic
├── database.sql               MySQL schema and demo account seed
├── server.js                  Express + MySQL API
├── package.json               Node.js dependencies and scripts
├── .env.example               Database configuration template
└── README.md
```
