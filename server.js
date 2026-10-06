const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const adminEmail = process.env.ADMIN_EMAIL?.trim();
const configuredSiteUrl = process.env.SITE_URL?.trim();
let canonicalSiteUrl = "";

if(configuredSiteUrl){
  let parsedSiteUrl;
  try{
    parsedSiteUrl = new URL(configuredSiteUrl);
  }catch{
    throw new Error("SITE_URL must be a valid absolute http:// or https:// URL.");
  }
  if(!["http:", "https:"].includes(parsedSiteUrl.protocol) || parsedSiteUrl.pathname !== "/" || parsedSiteUrl.search || parsedSiteUrl.hash || parsedSiteUrl.username || parsedSiteUrl.password){
    throw new Error("SITE_URL must contain only the canonical website origin, such as https://www.example.com.");
  }
  canonicalSiteUrl = parsedSiteUrl.origin;
}
if(process.env.NODE_ENV === "production" && !canonicalSiteUrl){
  throw new Error("Set SITE_URL to the public HTTPS origin before starting in production.");
}
if(process.env.NODE_ENV === "production" && !canonicalSiteUrl.startsWith("https://")){
  throw new Error("SITE_URL must use HTTPS in production.");
}

const tlsCertificatePath = process.env.TLS_CERT_PATH?.trim();
const tlsPrivateKeyPath = process.env.TLS_KEY_PATH?.trim();
if(Boolean(tlsCertificatePath) !== Boolean(tlsPrivateKeyPath)){
  throw new Error("Configure both TLS_CERT_PATH and TLS_KEY_PATH, or leave both blank.");
}
const tlsOptions = tlsCertificatePath ? {
  cert: fs.readFileSync(path.resolve(__dirname, tlsCertificatePath)),
  key: fs.readFileSync(path.resolve(__dirname, tlsPrivateKeyPath)),
} : null;

const publicPages = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/shop.html", "shop.html"],
  ["/quiz.html", "quiz.html"],
  ["/companion.html", "companion.html"],
  ["/experts.html", "experts.html"],
]);
const pageSeo = {
  "index.html": {
    title:"GreenNest Nepal | Plants, Plant Care & Garden Experts",
    description:"Shop indoor plants and garden supplies, get practical plant-care guidance, and book gardening experts in Nepal.",
  },
  "shop.html": {
    title:"Shop Plants & Garden Supplies in Nepal | GreenNest",
    description:"Browse indoor plants, seeds, pots, fertilizers, tools, and gardening supplies from GreenNest Nepal.",
  },
  "quiz.html": {
    title:"Find Plants for Your Space | GreenNest Nepal",
    description:"Answer a few questions about your light, space, and experience to find plants suited to your home.",
  },
  "companion.html": {
    title:"Companion Planting & Seasonal Guide | GreenNest",
    description:"Explore compatible plants and seasonal gardening recommendations for growers in Nepal.",
  },
  "experts.html": {
    title:"Book Gardening Experts in Nepal | GreenNest",
    description:"Find gardening professionals for plant installations, garden checkups, and practical growing advice.",
  },
};
const sitemapPaths = ["/", "/shop.html", "/quiz.html", "/companion.html", "/experts.html"];

function getSiteUrl(req){
  return canonicalSiteUrl || `${req.protocol}://${req.get("host")}`;
}

app.use(express.json({ limit:"32kb" }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "https://127.0.0.1:5500",
    "https://localhost:5500",
  ]);
  if(allowedOrigins.has(origin)){
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if(req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  if(process.env.NODE_ENV === "production" && canonicalSiteUrl.startsWith("https://")){
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
  next();
});

app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.set("Cache-Control", process.env.NODE_ENV === "production" ? "public, max-age=3600" : "no-store");
  if(process.env.NODE_ENV !== "production"){
    return res.send("User-agent: *\nDisallow: /\n");
  }
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin.html\nDisallow: /dashboard.html\nDisallow: /expert-panel.html\nDisallow: /login.html\nDisallow: /checkout.html\nDisallow: /api/\nSitemap: ${getSiteUrl(req)}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (req, res) => {
  const siteUrl = getSiteUrl(req);
  const urls = sitemapPaths.map((page) => {
    const location = new URL(page === "/" ? "/" : page, `${siteUrl}/`).href;
    return `  <url><loc>${location}</loc></url>`;
  }).join("\n");
  res.type("application/xml");
  res.set("Cache-Control", process.env.NODE_ENV === "production" ? "public, max-age=3600" : "no-store");
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

app.get([...publicPages.keys()], (req, res, next) => {
  const fileName = publicPages.get(req.path);
  fs.readFile(path.join(__dirname, fileName), "utf8", (error, page) => {
    if(error) return next(error);
    const siteUrl = getSiteUrl(req);
    const canonicalUrl = new URL(fileName === "index.html" ? "/" : `/${fileName}`, `${siteUrl}/`).href;
    const metadata = pageSeo[fileName];
    const canonicalTag = `<link rel="canonical" href="${canonicalUrl}">`;
    const setHeadTag = (pattern, tag) => {
      if(pattern.test(page)){
        page = page.replace(pattern, tag);
      }else{
        page = page.replace(/<\/head>/i, `${tag}\n</head>`);
      }
    };
    page = page.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`);
    setHeadTag(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${escapeHtml(metadata.description)}">`);
    setHeadTag(/<link rel="canonical" href="[^"]*">/i, canonicalTag);
    setHeadTag(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${escapeHtml(metadata.title)}">`);
    setHeadTag(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${escapeHtml(metadata.description)}">`);
    setHeadTag(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonicalUrl}">`);
    if(fileName === "index.html"){
      const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "GreenNest",
        url: canonicalUrl,
        description: metadata.description,
        inLanguage: "en",
      };
      page = page.replace(
        /<script id="greennest-website-schema" type="application\/ld\+json">[\s\S]*?<\/script>/i,
        `<script id="greennest-website-schema" type="application/ld+json">${JSON.stringify(websiteSchema)}</script>`,
      );
    }
    res.type("html");
    res.set("Cache-Control", "no-store");
    res.send(page);
  });
});

app.use(express.static(__dirname));

function requestError(message){
  return Object.assign(new Error(message), { statusCode:400 });
}

function requiredText(value, fieldName, maxLength=500){
  if(typeof value !== "string" || !value.trim()){
    throw requestError(`${fieldName} is required.`);
  }
  const text = value.trim();
  if(text.length > maxLength){
    throw requestError(`${fieldName} must be ${maxLength} characters or fewer.`);
  }
  return text;
}

function isEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value){
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createTransporter(){
  if(!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD){
    throw new Error("Gmail is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env.");
  }
  if(!adminEmail || !isEmail(adminEmail)){
    throw new Error("Set a valid ADMIN_EMAIL in .env before sending email.");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

function bookingText(booking){
  return [
    "GreenNest",
    "",
    "Booking confirmation",
    "",
    `Booking ID: ${booking.id}`,
    `Customer: ${booking.customerName || "GreenNest customer"}`,
    `Customer email: ${booking.customerEmail}`,
    `Expert: ${booking.expertName}`,
    `Specialty: ${booking.specialty}`,
    `Service cost: ${booking.price}`,
    `Preferred date and time: ${booking.date}`,
    `Notes: ${booking.note || "None"}`,
    "",
    "Thank you for choosing GreenNest.",
  ].join("\n");
}

function bookingHtml(booking){
  const rows = [
    ["Booking ID", booking.id],
    ["Customer", booking.customerName || "GreenNest customer"],
    ["Customer email", booking.customerEmail],
    ["Expert", booking.expertName],
    ["Specialty", booking.specialty],
    ["Service cost", booking.price],
    ["Preferred date and time", booking.date],
    ["Notes", booking.note || "None"],
  ].map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${escapeHtml(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`).join("");
  return `<div style="font-family:Arial,sans-serif;color:#16302a;max-width:620px"><h2 style="color:#315c43">GreenNest</h2><p>Booking confirmation</p><table style="border-collapse:collapse;width:100%;font-size:14px">${rows}</table><p>Thank you for choosing GreenNest.</p></div>`;
}

function orderHtml(order, items){
  const itemRows = items.map(item => {
    const name = item.name || `Product ${item.id || ""}`;
    const quantity = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const image = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="" width="54" height="54" style="display:block;border-radius:10px;object-fit:cover;">`
      : `<div style="width:54px;height:54px;border-radius:10px;background:#dceee5;text-align:center;line-height:54px;color:#315c43;font-size:22px;">🌿</div>`;
    return `<tr>
      <td style="padding:14px 10px;border-bottom:1px solid #e6eee9;">${image}</td>
      <td style="padding:14px 10px;border-bottom:1px solid #e6eee9;"><strong style="color:#16302a;">${escapeHtml(name)}</strong><br><span style="color:#71817a;font-size:12px;">Quantity: ${quantity}</span></td>
      <td style="padding:14px 10px;border-bottom:1px solid #e6eee9;text-align:right;color:#315c43;font-weight:700;">NPR ${(price * quantity).toLocaleString()}</td>
    </tr>`;
  }).join("");
  const address = `${order.shipping?.address || "Not provided"}, ${order.shipping?.city || ""}`;
  const payment = order.paymentMethod === "cash"
    ? "Cash on delivery"
    : order.paymentMethod === "wallet"
      ? "GreenNest wallet"
      : "Card (simulated; no charge collected)";
  return `<div style="margin:0;background:#f3f7f4;padding:28px 12px;font-family:Arial,sans-serif;color:#16302a;">
    <div style="max-width:620px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 18px rgba(22,48,42,.08);">
      <div style="background:#163f35;padding:28px 30px;color:#ffffff;">
        <div style="font-size:25px;font-weight:700;letter-spacing:.2px;">GreenNest</div>
        <div style="margin-top:8px;color:#cbe9d9;font-size:14px;">Your garden order is confirmed</div>
      </div>
      <div style="padding:28px 30px;">
        <p style="margin:0 0 6px;font-size:22px;font-weight:700;">Thank you, ${escapeHtml(order.customerName || "GreenNest customer")}!</p>
        <p style="margin:0 0 22px;color:#71817a;font-size:14px;">We have received your order and will prepare it for delivery.</p>
        <div style="background:#f3f7f4;border-radius:12px;padding:14px 16px;margin-bottom:22px;font-size:13px;">
          <div><strong>Order ID:</strong> ${escapeHtml(order.id || "Unavailable")}</div>
          <div style="margin-top:5px;"><strong>Deliver to:</strong> ${escapeHtml(address)}</div>
          <div style="margin-top:5px;"><strong>Phone:</strong> ${escapeHtml(order.shipping?.phone || "Not provided")}</div>
          <div style="margin-top:5px;"><strong>Payment:</strong> ${escapeHtml(payment)} — ${escapeHtml(order.paymentStatus || "")}</div>
        </div>
        <h3 style="margin:0 0 8px;font-size:16px;">Order summary</h3>
        <table role="presentation" style="border-collapse:collapse;width:100%;font-size:14px;">
          <tr><th colspan="2" style="padding:8px 10px;text-align:left;border-bottom:2px solid #dceee5;color:#71817a;font-size:11px;text-transform:uppercase;">Item</th><th style="padding:8px 10px;text-align:right;border-bottom:2px solid #dceee5;color:#71817a;font-size:11px;text-transform:uppercase;">Amount</th></tr>
          ${itemRows || `<tr><td colspan="3" style="padding:16px 10px;color:#71817a;">No item details available.</td></tr>`}
        </table>
        <div style="border-top:2px solid #163f35;margin-top:10px;padding:16px 10px 0;text-align:right;font-size:18px;font-weight:700;color:#163f35;">Total: NPR ${(Number(order.total) || 0).toLocaleString()}</div>
        <p style="margin:26px 0 0;color:#71817a;font-size:13px;">Thank you for choosing GreenNest for your growing space.</p>
      </div>
    </div>
  </div>`;
}

app.post("/api/bookings/email", async (req, res) => {
  try{
    const booking = req.body || {};
    const customerEmail = requiredText(booking.customerEmail, "Customer email");
    if(!isEmail(customerEmail)) return res.status(400).json({ error: "Enter a valid customer email address." });

    ["id", "expertName", "specialty", "price", "date"].forEach((field) => requiredText(booking[field], field));
    const transporter = createTransporter();
    const text = bookingText({ ...booking, customerEmail });
    const html = bookingHtml({ ...booking, customerEmail });

    await transporter.sendMail({
      from: `GreenNest <${process.env.GMAIL_USER}>`,
      to: customerEmail,
      replyTo: adminEmail,
      subject: `GreenNest booking confirmation - ${booking.id}`,
      text,
      html,
    });

    await transporter.sendMail({
      from: `GreenNest <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      replyTo: customerEmail,
      subject: `New GreenNest booking - ${booking.id}`,
      text,
      html,
    });

    res.status(202).json({ ok: true, message: "Confirmation email sent." });
  }catch(error){
    console.error("Booking email failed:", error.message);
    res.status(error.statusCode || 500).json({ error: error.message || "Unable to send booking email." });
  }
});

app.post("/api/orders/email", async (req, res) => {
  try{
    const payload = req.body || {};
    const orderId = requiredText(payload.id, "Order ID", 40);
    if(!/^[A-Z0-9-]+$/i.test(orderId)) return res.status(400).json({ error:"Order ID contains unsupported characters." });
    const paymentMethod = requiredText(payload.paymentMethod, "Payment method", 20);
    if(!["card", "cash", "wallet"].includes(paymentMethod)) return res.status(400).json({ error:"Choose card, cash on delivery, or the GreenNest wallet." });
    const paymentStatus = requiredText(payload.paymentStatus, "Payment status", 100);
    const expectedPaymentStatus = {
      card:"simulated; no charge collected",
      cash:"payment due on delivery",
      wallet:"paid from GreenNest wallet",
    }[paymentMethod];
    if(paymentStatus !== expectedPaymentStatus) return res.status(400).json({ error:"Payment status does not match the selected method." });
    if(!Number.isSafeInteger(payload.total) || payload.total <= 0) return res.status(400).json({ error:"Order total must be a positive whole number." });

    const sourceShipping = payload.shipping;
    if(!sourceShipping || typeof sourceShipping !== "object" || Array.isArray(sourceShipping)){
      return res.status(400).json({ error:"Delivery details are required." });
    }
    const shipping = {
      name:requiredText(sourceShipping.name, "Recipient name", 80),
      phone:requiredText(sourceShipping.phone, "Phone number", 20),
      address:requiredText(sourceShipping.address, "Delivery address", 240),
      city:requiredText(sourceShipping.city, "City", 80),
      email:requiredText(sourceShipping.email, "Customer email", 254),
    };
    if(!isEmail(shipping.email)) return res.status(400).json({ error:"Enter a valid customer email address." });
    if(!/^9\d{9}$/.test(shipping.phone)) return res.status(400).json({ error:"Enter a valid 10-digit phone number." });
    if(!Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 50){
      return res.status(400).json({ error:"Order must contain between 1 and 50 items." });
    }
    const items = payload.items.map((item)=>{
      if(!item || typeof item !== "object" || Array.isArray(item)) throw requestError("Order items are invalid.");
      const id = requiredText(String(item.id ?? ""), "Product ID", 40);
      const name = requiredText(item.name, "Product name", 120);
      if(!Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 100) throw requestError("Product quantity must be between 1 and 100.");
      if(!Number.isSafeInteger(item.price) || item.price <= 0) throw requestError("Product price must be a positive whole number.");
      return { id, name, qty:item.qty, price:item.price };
    });
    const calculatedTotal = items.reduce((sum, item)=>sum + item.price * item.qty, 0);
    if(!Number.isSafeInteger(calculatedTotal) || calculatedTotal !== payload.total){
      return res.status(400).json({ error:"Order total does not match its items." });
    }
    const order = {
      id:orderId,
      items,
      total:payload.total,
      customerName:requiredText(payload.customerName || shipping.name, "Customer name", 80),
      paymentMethod,
      paymentStatus,
      shipping,
    };

    const textItems = items.map((item)=>`${item.name} — Qty ${item.qty} × NPR ${item.price.toLocaleString()} = NPR ${(item.price * item.qty).toLocaleString()}`).join("\n");
    const text = [
      "GreenNest order confirmation",
      `Order ID: ${order.id}`,
      `Customer: ${order.customerName}`,
      `Customer email: ${shipping.email}`,
      `Phone: ${shipping.phone}`,
      `Delivery address: ${shipping.address}, ${shipping.city}`,
      `Payment: ${paymentMethod === "cash" ? "Cash on delivery" : paymentMethod === "wallet" ? "GreenNest wallet" : "Card (simulated; no charge collected)"} — ${paymentStatus}`,
      `Total: NPR ${order.total.toLocaleString()}`,
      "",
      "Items:",
      textItems,
      "",
      "Thank you for choosing GreenNest.",
    ].join("\n");
    const html = orderHtml(order, items);
    const transporter = createTransporter();
    await transporter.sendMail({
      from:`GreenNest <${process.env.GMAIL_USER}>`,
      to:shipping.email,
      bcc:adminEmail,
      replyTo:shipping.email,
      subject:`GreenNest order confirmation - ${order.id}`,
      text,
      html,
    });

    res.status(202).json({ ok:true, message:"Order confirmation sent." });
  }catch(error){
    console.error("Order email failed:", error.message);
    res.status(error.statusCode || 500).json({ error:error.message || "Unable to send order email." });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

const server = tlsOptions ? https.createServer(tlsOptions, app) : http.createServer(app);
const onListening = () => {
  const protocol = tlsOptions ? "https" : "http";
  console.log(`GreenNest running at ${protocol}://localhost:${port}`);
};
if(process.env.HOST){
  server.listen(port, process.env.HOST, onListening);
}else{
  server.listen(port, onListening);
}
