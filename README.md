# GreenNest — Smart Gardening E-Commerce & Plant Care Management System

A working prototype web app built from the GreenNest project proposal (Dipsan Silwal, Dept. of CSIT, Tribhuvan University).
Plain HTML/CSS/JavaScript with a small Node.js email backend.

## How to run it

1. Install Node.js 18 or newer.
2. In PowerShell, open this project folder and run:

   ```powershell
   npm.cmd install
   npm.cmd start
   ```

   Using `npm.cmd` avoids PowerShell script-execution-policy errors with `npm.ps1`. Open `http://localhost:3000`. HTTPS is optional for local development; see [Local HTTPS (TLS)](#local-https-tls).
3. Sign in with one of the sample accounts below. The admin account opens the **Admin Panel**, expert accounts open the **Expert Panel**, and customer accounts open the homepage.
4. After signing in, click through the nav: **Home → Shop → Plant Quiz → Companion Planner → Dashboard → Experts**.

### Sample sign-in accounts

- **Admin:** `admin` / `admin` (the only admin account)
- **Customers:** `customer1` / `customer1` through `customer5` / `customer5`
- **Experts:** `expert1` / `expert1` through `expert6` / `expert6`

Each customer and expert has separate browser-stored account data. The account number matches the customer or expert profile shown after sign-in.

State (cart, wishlist, plants, journal, orders, bookings) is saved in the browser's local storage, so it survives page reloads. Order delivery details are sent for confirmation but are not retained in the local order history; customer booking email and name are also excluded from saved bookings. Booking service notes are retained for the expert workflow, so enter gardening requirements only—not contact, payment, or other private details. Local storage remains readable to browser scripts and the device user; the built-in accounts and browser-stored app data are for local evaluation only and must not be used for real customer accounts. To enable booking and order confirmation emails, set `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `ADMIN_EMAIL` in `.env`. Configure a Google App Password for the Gmail account; email is optional for running the rest of the local app.

Never put a normal Gmail password in `.env`, and never commit `.env`, TLS private keys, or real credentials.

### Local HTTPS (TLS)

The Express server uses HTTP by default. To test HTTPS locally with a trusted development certificate:

1. Install [mkcert](https://github.com/FiloSottile/mkcert) on your development machine and open a new terminal.
2. From the project folder, create a local certificate. The private certificate authority is trusted on this machine only:

   ```powershell
   New-Item -ItemType Directory -Force .certs
   mkcert -install
   mkcert -key-file .certs/localhost-key.pem -cert-file .certs/localhost.pem localhost 127.0.0.1 ::1
   ```

3. Set these paths in your ignored `.env` file:

   ```dotenv
   TLS_CERT_PATH=.certs/localhost.pem
   TLS_KEY_PATH=.certs/localhost-key.pem
   ```

4. Run `npm.cmd start` and open `https://localhost:3000`. Leave both TLS variables unset to return to HTTP. The app requires both paths together.

To serve the full GreenNest app at `https://127.0.0.1:5500/`, stop Live Server and run this from the project folder after creating the certificate:

```powershell
$env:PORT = "5500"
$env:HOST = "127.0.0.1"
$env:SITE_URL = "https://127.0.0.1:5500"
$env:TLS_CERT_PATH = ".certs\localhost.pem"
$env:TLS_KEY_PATH = ".certs\localhost-key.pem"
npm.cmd start
```

These environment variables apply only to that PowerShell window. To keep this setup between sessions, put the same values in your ignored `.env` file instead. Do not run Live Server and the Express app on the same port.

### Use HTTPS with VS Code Live Server

Live Server is separate from the Express server above. If you need the static preview too, use port `5501` so it does not conflict with GreenNest on `5500`. After creating the trusted certificate, add this workspace setting to `.vscode/settings.json`, replacing the certificate paths with their full paths on your computer:

```json
{
  "liveServer.settings.port": 5501,
  "liveServer.settings.https": {
    "enable": true,
    "cert": "C:\\path\\to\\GreenNest\\.certs\\localhost.pem",
    "key": "C:\\path\\to\\GreenNest\\.certs\\localhost-key.pem",
    "passphrase": ""
  }
}
```

The workspace settings file is intentionally ignored by Git because certificate paths are machine-specific. Add a Live Server proxy in the same settings file so `/api` forwards to `http://127.0.0.1:3000/api`:

```json
"liveServer.settings.proxy": {
  "enable": true,
  "baseUri": "/api",
  "proxyUri": "http://127.0.0.1:3000/api"
}
```

Set `PORT=3000` in `.env`, run `npm.cmd start`, then restart Live Server from the VS Code Command Palette and open `https://127.0.0.1:5501/`. The browser talks to the API through the HTTPS Live Server origin; the proxy forwards those requests to the local HTTP Node backend, so TLS on Node is not required. The mkcert certificate is trusted only on the machine where `mkcert -install` was run.

For production, use your hosting platform or reverse proxy to obtain, renew, and terminate a publicly trusted TLS certificate. Set `NODE_ENV=production` and `SITE_URL=https://your-real-domain.example` (replace this with your real origin, without a path) in the deployment environment. Production startup intentionally fails if `SITE_URL` is absent or not HTTPS. Do not upload the local `.certs` files or use a self-signed development certificate for a public website. If TLS terminates at a reverse proxy, configure the real public `SITE_URL` there; the app uses it for canonical URLs, Open Graph URLs, `robots.txt`, and the XML sitemap.

### Search engine setup

- The public homepage, shop, plant quiz, companion planner, and experts pages have distinct search titles and descriptions, one descriptive H1, and meaningful H2/H3 section headings.
- The server emits absolute canonical and Open Graph URLs for those public pages, plus WebSite Schema.org JSON-LD on the homepage.
- `https://your-real-domain.example/robots.txt` and `/sitemap.xml` are generated by the Node server. In development, `robots.txt` blocks indexing; in production, configure `SITE_URL` so it can publish the real sitemap URL.
- Login, dashboard, checkout, admin, and expert-panel pages are marked `noindex` and intentionally omitted from the sitemap.
- Re-run the SEO audit against the deployed HTTPS domain after setting `SITE_URL`. Localhost addresses are not public crawl targets. Analytics is optional and remains disabled until you configure your own IDs and consent requirements.

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
| `admin.html` | Admin module | Edit product and expert details, review orders and appointments, inspect simulated payment history, and generate CSV reports |

## What's genuinely functional (not just static mockups)

- **Cart & checkout** — persists across every page, real quantity controls, checkout clears cart into an order history
- **Wishlist** — heart-toggle on any product, visible from the dashboard
- **Plant Quiz** — an actual scoring algorithm against the product catalog, not a canned result
- **Companion Planner** — real compatibility logic (good/bad pairings) and season-based filtering
- **Weather reminders** — calls the free [Open-Meteo](https://open-meteo.com) API live, using your browser's geolocation (falls back to Kathmandu), and generates watering/heat/rain alerts from the actual forecast
- **Growth journal** — add plants, log care notes, see a visual timeline of activity
- **Expert bookings** — requests remain unpaid until accepted. The customer can then pay from the local GreenNest wallet simulation; successful simulated payments split 80% to the expert and 20% to GreenNest, rounded to whole NPR with any rounding remainder going to the expert.
- **Admin payment history** — the Payments tab shows recorded wallet receipts, collected cash, payer account, method, reference, and expert/GreenNest allocations; export the ledger as CSV. It includes wallet-paid plant orders, simulated paid expert bookings, and cash-on-delivery orders recorded by an admin after delivery. Simulated card orders are not counted as money received.
- **Order delivery updates** — admins advance orders through Preparing order → Left store → In transit → Out for delivery → Delivered. Customers see the timestamped history and a dashboard notification when they return after a status change. These in-browser updates are not push notifications or emails, and do not sync across browsers/devices.
- **Admin reports** — the Reports tab exports real CSV files (products, orders, bookings) generated from live app state
- **Role-based access** — customers use the storefront and customer dashboard; experts use the booking panel; admins use the management panel. Admins and experts are redirected away from shopping/checkout, and customers cannot open management pages.
- **Admin catalog editing** — administrators can edit product descriptions, categories, prices, stock and supported environments, and expert names, specialties, rates and bios. These edits persist in this browser and appear in the customer storefront; the prototype does not provide real server-side accounts or shared storage.
- **Purchase recommendations** — the shop combines explicit related-product suggestions (compatible plants, fertilizer, pots and tools) with category affinity and collaborative filtering over purchase histories saved in this browser
- **Analytics hooks** — optional GA4 and Meta Pixel page views, product-list impressions, clicks, cart/checkout funnel, purchases and consultation leads; blank IDs disable third-party requests
- **Order fingerprint preview** — the order screen displays a browser-generated SHA-256 hash of the order ID, total, timestamp and product IDs/quantities. This informational fingerprint does not secure, verify or authenticate a payment.
- **Checkout and expert payments** — cash on delivery and the GreenNest wallet place plant orders. Expert services require wallet payment after acceptance and use the 80/20 simulated split. Wallet loading uses a local simulation; card fields are validated locally only, no real card authorization or charge occurs, and card details are not stored or transmitted.

## How to customize / re-edit

Everything is organized so a specific change lives in one obvious place:

- **Colors & fonts** → `css/style.css`, section `1. DESIGN TOKENS` at the top. Change the CSS variables (`--forest`, `--moss`, `--gold`, etc.) and the whole site updates — no need to touch individual pages.
- **Products, experts, companion data** → `js/data.js`. Add a new product by adding an object to the `PRODUCTS` array; same pattern for `EXPERTS`, `COMPANIONS`, `SEASON_PLANTS`.
- **Cart / wishlist / booking logic** → `js/main.js`. All shared behavior (add to cart, toggle wishlist, place order, book an expert) lives here so it's consistent across pages.
- **Page-specific layout/behavior** → each `.html` file has its own `<style>` block (page-only CSS) and `<script>` block (page-only logic) near the bottom, clearly separated from the shared files.
- **Responsive layout** → grids use `repeat(auto-fit, minmax(...))` instead of fixed column counts, so cards reflow naturally at any window width without needing extra breakpoints. If you add a new grid, follow the same pattern (see `.product-grid`, `.expert-grid`, etc. for examples).
- **Analytics / AdSense** → set `ga4Id`, `metaPixelId`, `adsenseClient` and `adsenseSlot` in `js/tracking-config.js`. Use IDs from your own accounts; the blank defaults keep third-party tracking disabled. AdSense test mode is enabled until you configure a publisher client and ad slot. GA4 records page views, clicks, product impressions, checkout steps, purchases and consultation leads; localhost sessions use GA4 debug mode for DebugView. Bounce rate is available in GA4 Reports after traffic arrives.
- **On-page SEO** → public pages have page-specific titles, descriptions, keywords and social-sharing metadata in each HTML `<head>`. Account and checkout pages are marked `noindex`.

## Honest scope notes

Booking email delivery uses the Node.js backend and Gmail SMTP. Orders, bookings, wallet balances, expert 80/20 allocations, catalog edits, and the admin payment ledger are all stored in browser `localStorage`, not in a shared or trusted database. They are for demonstration only: no real money moves, eSewa top-ups are simulated, and another browser/device will not see these records. Do not use the client-side balances, split, or history to settle real funds. Production payments and multi-role access control require an authenticated server-side database and a real payment provider with verified webhooks, refunds, and reconciliation. Collaborative filtering likewise sees only this browser's order history; new shoppers see related catalog suggestions until purchase history is available. Real analytics/ad reporting requires valid account IDs and appropriate user consent; AdSense also requires publisher approval and a configured ad unit/domain.

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
├── server.js                 Email API, SEO routes, optional TLS and static file server
├── package.json              Backend dependencies and start script
├── package-lock.json         Reproducible npm dependency versions
├── .env.example              Email and local server configuration template
└── README.md
```
