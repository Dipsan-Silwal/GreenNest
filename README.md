# GreenNest — Smart Gardening E-Commerce & Plant Care Management System

A working demo web app built from the GreenNest project proposal (Dipsan Silwal, Dept. of CSIT, Tribhuvan University).
Plain HTML/CSS/JavaScript — no install, no build step, no server required.

## How to run it

1. Double-click `index.html` to open it in your browser (Chrome, Edge, or Firefox recommended).
2. Click through the nav: **Home → Shop → Plant Quiz → Companion Planner → Dashboard → Experts**.

State (cart, wishlist, plants, journal, orders, bookings) is saved in the browser's local storage, so it survives page reloads. Keep an internet connection open for Google Fonts and the live weather API on the Dashboard; the site still works offline, just with fallback system fonts and a "weather unavailable" message.

## Pages

| Page | Proposal module | What it does |
|---|---|---|
| `index.html` | Introduction / Overview | Landing page, problem statement, quick links |
| `shop.html` | Customer — marketplace | 21 products / 6 categories, filter + search, cart, wishlist |
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
- **Admin reports** — the Reports tab exports real CSV files (products, orders, bookings) generated from live app state

## How to customize / re-edit

Everything is organized so a specific change lives in one obvious place:

- **Colors & fonts** → `css/style.css`, section `1. DESIGN TOKENS` at the top. Change the CSS variables (`--forest`, `--moss`, `--gold`, etc.) and the whole site updates — no need to touch individual pages.
- **Products, experts, companion data** → `js/data.js`. Add a new product by adding an object to the `PRODUCTS` array; same pattern for `EXPERTS`, `COMPANIONS`, `SEASON_PLANTS`.
- **Cart / wishlist / booking logic** → `js/main.js`. All shared behavior (add to cart, toggle wishlist, place order, book an expert) lives here so it's consistent across pages.
- **Page-specific layout/behavior** → each `.html` file has its own `<style>` block (page-only CSS) and `<script>` block (page-only logic) near the bottom, clearly separated from the shared files.
- **Responsive layout** → grids use `repeat(auto-fit, minmax(...))` instead of fixed column counts, so cards reflow naturally at any window width without needing extra breakpoints. If you add a new grid, follow the same pattern (see `.product-grid`, `.expert-grid`, etc. for examples).

## Honest scope notes

This is a frontend-only demo: there's no real Node.js/SQL Server backend (the proposal's stated stack) — data lives in the browser via `localStorage` instead of a database, and the "weather API" and "notification service" are represented by one real live API call (Open-Meteo) plus in-app toast notifications. The Customer, Expert, and Admin modules from the proposal all have working screens here; wiring them to a shared real-time backend (so an Expert's "Accept" instantly updates the Customer's booking status on another device) is the natural next step and matches the proposal's own roadmap.

## Tech used

HTML5, CSS3, vanilla JavaScript — matching the frontend layer named in the proposal (HTML5 / CSS3 / Bootstrap-equivalent / JavaScript). No frameworks, no build tools, nothing to install.

## Folder structure

```
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
└── README.md
```
