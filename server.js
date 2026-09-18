const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const adminEmail = process.env.ADMIN_EMAIL || "deeplight200@gmail.com";

app.use(express.json());
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if(origin === "http://127.0.0.1:5500" || origin === "http://localhost:5500"){
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  }
  if(req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.static(__dirname));

function requiredText(value, fieldName){
  if(typeof value !== "string" || !value.trim()){
    throw new Error(`${fieldName} is required.`);
  }
  return value.trim();
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
  ].join("\\n");
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
    res.status(500).json({ error: error.message || "Unable to send booking email." });
  }
});

app.post("/api/orders/email", async (req, res) => {
  try{
    const order = req.body || {};
    const customerEmail = order.shipping?.email?.trim() || "";
    if(!customerEmail || !isEmail(customerEmail)) return res.status(400).json({ error: "A valid customer email address is required." });

    const transporter = createTransporter();
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const items = orderItems.length
      ? orderItems.map(item => `${item.name || `Product ${item.id}`} x ${item.qty}`).join("\n")
      : "Unavailable";
    const text = [
      "GreenNest order confirmation",
      `Order ID: ${order.id}`,
      `Customer: ${order.customerName || "GreenNest customer"}`,
      `Customer email: ${customerEmail}`,
      `Phone: ${order.shipping?.phone || "Not provided"}`,
      `Address: ${order.shipping?.address || "Not provided"}, ${order.shipping?.city || ""}`,
      `Total: NPR ${order.total}`,
      "",
      "Items:",
      items,
    ].join("\n");
    const html = orderHtml(order, orderItems);
    await transporter.sendMail({
      from: `GreenNest <${process.env.GMAIL_USER}>`,
      to: [adminEmail, customerEmail],
      replyTo: customerEmail,
      subject: `GreenNest order confirmation - ${order.id}`,
      text,
      html,
    });

    res.status(202).json({ ok: true, message: "Order confirmation sent." });
  }catch(error){
    console.error("Order email failed:", error.message);
    res.status(500).json({ error: error.message || "Unable to send order email." });
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(port, () => {
  console.log(`GreenNest running at http://localhost:${port}`);
});
