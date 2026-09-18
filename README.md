# GreenNest — Smart Gardening E-Commerce & Plant Care Management System

A working demo web app built from the GreenNest project proposal (Dipsan Silwal, Dept. of CSIT, Tribhuvan University).
Plain HTML/CSS/JavaScript with a small Node.js email backend.

## How to run it

1. Install Node.js 18 or newer.
2. Run `npm install` in this folder.
3. Copy `.env.example` to `.env` and fill in `GMAIL_APP_PASSWORD` with a Google App Password for `deeplight200@gmail.com`.
4. Run `npm start` and open `http://localhost:3000`.
5. Click through the nav: **Home → Shop → Plant Quiz → Companion Planner → Dashboard → Experts**.
6. Use the **"Customer view ▾"** switcher in the top-right of the nav to jump to the **Expert Panel** or **Admin Panel**.

State (cart, wishlist, plants, journal, orders, bookings) is saved in the browser's local storage, so it survives page reloads. Booking confirmation emails are sent by the Node.js backend through Gmail: the customer receives a confirmation and `deeplight200@gmail.com` receives the booking notification.

For Gmail, enable 2-Step Verification and create an App Password. Do not put the normal Gmail password in `.env` or commit `.env` to source control.

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

Booking email delivery now uses the Node.js backend and Gmail SMTP. Other application data still lives in the browser via `localStorage` instead of a database, and the Customer, Expert, and Admin modules remain a local demo. Wiring them to a shared database and real-time backend is a separate next step.

## Tech used

HTML5, CSS3, vanilla JavaScript, Node.js, Express, and Nodemailer.

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
├── server.js                 Gmail booking email API and static file server
├── package.json              Backend dependencies and start script
├── .env.example              Gmail configuration template
└── README.md
```
