require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || "greennest",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

function asyncRoute(handler){
  return (req, res, next)=>Promise.resolve(handler(req, res, next)).catch(next);
}
function requireUser(req, res, next){
  const userId = Number(req.header("x-user-id"));
  if(!Number.isInteger(userId) || userId < 1) return res.status(401).json({ error:"x-user-id header is required" });
  req.userId = userId;
  next();
}

app.get("/api/health", asyncRoute(async(req, res)=>{
  await pool.query("SELECT 1");
  res.json({ ok:true, database:"mysql" });
}));

app.post("/api/auth/login", asyncRoute(async(req, res)=>{
  const { username, password, role } = req.body || {};
  const [rows] = await pool.execute(
    "SELECT id, username, role, display_name AS label FROM users WHERE username = ? AND password = ? AND role = ? LIMIT 1",
    [String(username || "").trim().toLowerCase(), String(password || ""), String(role || "").trim().toLowerCase()]
  );
  if(!rows.length) return res.status(401).json({ error:"Invalid username or password" });
  res.json(rows[0]);
}));

app.get("/api/products", asyncRoute(async(req, res)=>{
  const [rows] = await pool.query("SELECT id, name, category, environments AS env, light, price, stock, image, description AS `desc` FROM products ORDER BY id");
  res.json(rows.map(product=>({ ...product, env:typeof product.env === "string" ? JSON.parse(product.env) : product.env })));
}));

app.post("/api/products", requireUser, asyncRoute(async(req, res)=>{
  const { name, category, env, light = "any", price, stock = 0, image = "", desc = "" } = req.body || {};
  if(!name || !category || !Array.isArray(env) || !Number.isFinite(Number(price)) || Number(price) <= 0 || !Number.isInteger(Number(stock)) || Number(stock) < 0){
    return res.status(400).json({ error:"name, category, env, positive price, and non-negative stock are required" });
  }
  const [result] = await pool.execute(
    "INSERT INTO products (name, category, environments, light, price, stock, image, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [name.trim(), category, JSON.stringify(env), light, Number(price), Number(stock), image, desc]
  );
  const [rows] = await pool.execute("SELECT id, name, category, environments AS env, light, price, stock, image, description AS `desc` FROM products WHERE id = ?", [result.insertId]);
  res.status(201).json({ ...rows[0], env:JSON.parse(rows[0].env) });
}));

app.patch("/api/products/:id", requireUser, asyncRoute(async(req, res)=>{
  const productId = Number(req.params.id);
  const allowed = ["name", "category", "env", "light", "price", "stock", "image", "desc"];
  const fields = [];
  const values = [];
  for(const key of allowed){
    if(req.body?.[key] === undefined) continue;
    const column = key === "env" ? "environments" : key === "desc" ? "description" : key;
    fields.push(`${column} = ?`);
    values.push(key === "env" ? JSON.stringify(req.body[key]) : req.body[key]);
  }
  if(!Number.isInteger(productId) || !fields.length) return res.status(400).json({ error:"A product id and at least one field are required" });
  values.push(productId);
  const [result] = await pool.execute(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, values);
  if(!result.affectedRows) return res.status(404).json({ error:"Product not found" });
  res.json({ ok:true });
}));

app.post("/api/wallet/top-up", requireUser, asyncRoute(async(req, res)=>{
  const amount = Number(req.body?.amount);
  if(!Number.isFinite(amount) || amount < 100 || amount > 50000) return res.status(400).json({ error:"Amount must be between NPR 100 and NPR 50,000" });
  const connection = await pool.getConnection();
  try{
    await connection.beginTransaction();
    await connection.execute("INSERT INTO wallets (user_id, balance) VALUES (?, 0) ON DUPLICATE KEY UPDATE user_id = user_id", [req.userId]);
    await connection.execute("UPDATE wallets SET balance = balance + ? WHERE user_id = ?", [amount, req.userId]);
    await connection.execute("INSERT INTO wallet_transactions (user_id, type, amount, label, reference) VALUES (?, 'credit', ?, 'eSewa top-up', ?)", [req.userId, amount, `ES${Date.now().toString().slice(-8)}`]);
    const [[wallet]] = await connection.execute("SELECT balance FROM wallets WHERE user_id = ?", [req.userId]);
    await connection.commit();
    res.json({ ok:true, balance:wallet.balance });
  }catch(error){ await connection.rollback(); throw error; }finally{ connection.release(); }
}));

app.post("/api/orders", requireUser, asyncRoute(async(req, res)=>{
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  if(!items.length) return res.status(400).json({ error:"At least one order item is required" });
  const connection = await pool.getConnection();
  try{
    await connection.beginTransaction();
    let total = 0;
    const resolved = [];
    for(const item of items){
      const quantity = Number(item.quantity ?? item.qty);
      const [rows] = await connection.execute("SELECT id, price, stock FROM products WHERE id = ? FOR UPDATE", [Number(item.productId ?? item.id)]);
      if(!rows.length || !Number.isInteger(quantity) || quantity < 1 || rows[0].stock < quantity) throw Object.assign(new Error("Product stock is insufficient"), { status:409 });
      total += rows[0].price * quantity;
      resolved.push({ productId:rows[0].id, quantity, unitPrice:rows[0].price });
    }
    const [[wallet]] = await connection.execute("SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE", [req.userId]);
    if(!wallet || wallet.balance < total) throw Object.assign(new Error("Insufficient wallet balance"), { status:409 });
    const [orderResult] = await connection.execute("INSERT INTO orders (customer_id, total, shipping) VALUES (?, ?, ?)", [req.userId, total, JSON.stringify(req.body.shipping || null)]);
    for(const item of resolved){
      await connection.execute("INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)", [orderResult.insertId, item.productId, item.quantity, item.unitPrice]);
      await connection.execute("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.productId]);
    }
    await connection.execute("UPDATE wallets SET balance = balance - ? WHERE user_id = ?", [total, req.userId]);
    await connection.execute("INSERT INTO wallet_transactions (user_id, type, amount, label, reference) VALUES (?, 'debit', ?, 'Payment to GreenNest', ?)", [req.userId, total, `GN${orderResult.insertId}`]);
    await connection.commit();
    res.status(201).json({ id:orderResult.insertId, total, status:"Approved" });
  }catch(error){ await connection.rollback(); res.status(error.status || 500).json({ error:error.message }); }finally{ connection.release(); }
}));

app.use((error, req, res, next)=>{
  console.error(error);
  res.status(500).json({ error:"Internal server error" });
});

app.listen(port, ()=>console.log(`GreenNest API running at http://localhost:${port}`));
