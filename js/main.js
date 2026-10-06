/* ==========================================================
   GreenNest — shared app logic
   Uses localStorage so state persists across pages & reloads.
   ========================================================== */

const LS = {
  cart: "greennest_cart",
  wishlist: "greennest_wishlist",
  journal: "greennest_journal",
  bookings: "greennest_bookings",
  orders: "greennest_orders",
  payments: "greennest_payment_history",
  plants: "greennest_plants",
  session: "greennest_session",
  wallets: "greennest_wallets",
};

const SAMPLE_USERS = {
  admin: { username: "admin", password: "admin", role: "admin", label: "Admin" },
};

function getSession(){ return readLS(LS.session, null); }
function setSession(user){ writeLS(LS.session, user); }
function clearSession(){ localStorage.removeItem(LS.session); }
function getUserHome(role){
  if(role === "admin") return "admin.html";
  if(role === "expert") return "expert-panel.html";
  return "index.html";
}
function getSampleAccount(username, role){
  const roleKey = String(role || "").trim().toLowerCase();
  const usernameKey = String(username || "").trim().toLowerCase();
  if(roleKey === "admin"){
    return usernameKey === SAMPLE_USERS.admin.username ? SAMPLE_USERS.admin : null;
  }
  if(roleKey !== "customer" && roleKey !== "expert") return null;

  const match = new RegExp(`^${roleKey}(\\d+)$`).exec(usernameKey);
  if(!match || String(Number(match[1])) !== match[1]) return null;
  const accountNumber = Number(match[1]);
  if(roleKey === "customer"){
    const customer = CUSTOMER_PROFILES.find(profile=>profile.username === usernameKey);
    return customer ? { username:usernameKey, password:usernameKey, role:roleKey, label:customer.name } : null;
  }
  const expert = EXPERTS.find(profile=>profile.id === accountNumber);
  return expert ? { username:usernameKey, password:usernameKey, role:roleKey, label:expert.name } : null;
}
function loginSampleUser(username, role, password){
  const user = getSampleAccount(username, role);
  if(!user) return false;
  if(String(password || "") !== user.password) return false;
  const session = { username: user.username, role: user.role, label: user.label };
  setSession(session);
  return session;
}
function logoutUser(){
  clearSession();
  window.location.href = "login.html";
}
function ensureAuthUI(){
  const nav = document.querySelector(".nav-icons");
  if(!nav || document.getElementById("user-pill")) return;
  const session = getSession();
  const wrapper = document.createElement("div");
  wrapper.className = "auth-user";
  wrapper.innerHTML = `
    <span id="user-pill" class="user-pill">${session ? session.label : "Guest"}</span>
    <button id="logout-btn" class="logout-btn" type="button" onclick="logoutUser()">Logout</button>
  `;
  nav.appendChild(wrapper);

  const userPill = document.getElementById("user-pill");
  if(userPill && session){
    userPill.textContent = session.label;
  }
}
function checkPageAccess(){
  const page = document.body.dataset.page || "";
  const session = getSession();

  if(page === "login"){
    if(session){ window.location.href = getUserHome(session.role); }
    return;
  }

  if(!session){
    window.location.href = "login.html";
    return;
  }

  const allowed = {
    home: ["customer", "expert", "admin"],
    shop: ["customer", "expert", "admin"],
    quiz: ["customer", "expert", "admin"],
    companion: ["customer", "expert", "admin"],
    dashboard: ["customer", "admin"],
    checkout: ["customer", "expert", "admin"],
    experts: ["customer", "expert", "admin"],
    admin: ["admin"],
    "expert-panel": ["expert", "admin"],
  };

  if(allowed[page] && !allowed[page].includes(session.role)){
    window.location.href = getUserHome(session.role);
  }
}

function readLS(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function writeLS(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)); }catch(e){ /* storage unavailable */ }
}
function removeStoredFields(key, fields){
  const records = readLS(key, null);
  if(!Array.isArray(records)) return;
  let changed = false;
  const minimized = records.map(record=>{
    if(!record || typeof record !== "object" || Array.isArray(record)) return record;
    const copy = { ...record };
    fields.forEach(field=>{
      if(Object.prototype.hasOwnProperty.call(copy, field)){
        delete copy[field];
        changed = true;
      }
    });
    return copy;
  });
  if(changed) writeLS(key, minimized);
}
removeStoredFields(LS.orders, ["shipping"]);
removeStoredFields(LS.bookings, ["customerEmail", "customerName"]);
function userStorageKey(key){
  const username = getSession()?.username || "guest";
  return `${key}_${username}`;
}

/* ---------------- ANALYTICS ---------------- */
function gnTrack(eventName, parameters={}, metaEvent=null, metaParameters={}){
  if(typeof window.gtag === "function"){
    window.gtag("event", eventName, parameters);
  }
  if(typeof window.fbq === "function" && metaEvent){
    window.fbq("track", metaEvent, metaParameters);
  }
  gnLogMarketingEvent(eventName);
}

function gnLogMarketingEvent(eventName){
  const allowedEvents = new Set([
    "page_view", "view_item_list", "click", "recommendation_click", "add_to_cart",
    "begin_checkout", "add_shipping_info", "add_payment_info", "purchase", "generate_lead",
  ]);
  if(!allowedEvents.has(eventName)) return;
  const events = readLS("greennest_marketing_events", []);
  events.unshift({ name:eventName, time:new Date().toISOString() });
  writeLS("greennest_marketing_events", events.slice(0, 8));
  gnRenderMarketingPanel();
}

function gnRenderMarketingPanel(){
  const panel = document.getElementById("marketing-integration-panel");
  if(!panel) return;
  const config = window.GN_TRACKING_CONFIG || {};
  const ids = config.placeholderIds || {};
  const tools = [
    { key:"ga4", name:"Google Analytics 4", configured:Boolean(config.ga4Id), placeholderId:ids.ga4 || "NOT-CONFIGURED" },
    { key:"metaPixel", name:"Meta Pixel", configured:Boolean(config.metaPixelId), placeholderId:ids.metaPixel || "NOT-CONFIGURED" },
    { key:"adsense", name:"Google AdSense", configured:Boolean(config.adsenseClient && config.adsenseSlot), placeholderId:`${ids.adsenseClient || "NOT-CONFIGURED"} / ${ids.adsenseSlot || "NOT-CONFIGURED"}` },
  ];
  const list = document.getElementById("marketing-integration-tools");
  if(list){
    list.innerHTML = tools.map(tool=>`
      <div class="marketing-tool">
        <span><strong>${tool.name}</strong><code>${tool.placeholderId}</code></span>
        <span class="marketing-status">${tool.configured ? "Configured" : "Not configured"}</span>
      </div>
    `).join("");
  }
  const events = readLS("greennest_marketing_events", []);
  const eventList = document.getElementById("marketing-activity");
  if(eventList){
    eventList.innerHTML = events.length
      ? events.map(event=>`<li><code>${event.name}</code><time>${new Date(event.time).toLocaleTimeString()}</time></li>`).join("")
      : "<li>Recent browsing activity will appear here.</li>";
  }
}

function gnProductItems(items){
  return items.map(item=>{
    const product = PRODUCTS.find(candidate=>candidate.id===item.id);
    if(!product) return null;
    return {
      item_id: String(product.id),
      item_name: product.name,
      item_category: product.category,
      price: product.price,
      quantity: item.qty || 1,
    };
  }).filter(Boolean);
}

function gnStartAnalytics(){
  const config = window.GN_TRACKING_CONFIG || {};
  const ga4Id = typeof config.ga4Id === "string" ? config.ga4Id.trim() : "";
  const pixelId = typeof config.metaPixelId === "string" ? config.metaPixelId.trim() : "";
  const adsenseClient = typeof config.adsenseClient === "string" ? config.adsenseClient.trim() : "";
  const adsenseSlot = typeof config.adsenseSlot === "string" ? config.adsenseSlot.trim() : "";

  if(ga4Id){
    if(!/^G-[A-Z0-9]+$/i.test(ga4Id)){
      console.warn("GreenNest analytics: GN_TRACKING_CONFIG.ga4Id is invalid; GA4 was not loaded.");
    }else{
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      const isLocalDebug = ["localhost", "127.0.0.1"].includes(window.location.hostname);
      window.gtag("config", ga4Id, { debug_mode:isLocalDebug });
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`;
      document.head.appendChild(script);
    }
  }

  if(pixelId){
    if(!/^\d{5,20}$/.test(pixelId)){
      console.warn("GreenNest analytics: GN_TRACKING_CONFIG.metaPixelId is invalid; Meta Pixel was not loaded.");
    }else{
      !function(f,b,e,v,n,t,s){
        if(f.fbq)return;
        n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=true;n.version="2.0";n.queue=[];
        t=b.createElement(e);t.async=true;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
      }(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", pixelId);
      window.fbq("track", "PageView");
    }
  }

  if(adsenseClient || adsenseSlot){
    if(!/^ca-pub-\d{10,24}$/.test(adsenseClient) || !/^\d+$/.test(adsenseSlot)){
      console.warn("GreenNest ads: set a valid AdSense client and ad slot in GN_TRACKING_CONFIG to display ads.");
    }else{
      const placement = document.getElementById("greennest-ad");
      if(placement){
        placement.hidden = false;
        placement.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseClient}" data-ad-slot="${adsenseSlot}" data-ad-format="auto" data-full-width-responsive="true" data-adtest="on"></ins>`;
        const script = document.createElement("script");
        script.async = true;
        script.crossOrigin = "anonymous";
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(adsenseClient)}`;
        script.onload = ()=>{ (window.adsbygoogle = window.adsbygoogle || []).push({}); };
        document.head.appendChild(script);
      }
    }
  }
}

function gnTrackProductImpressions(container){
  if(!container) return;
  const cards = container.querySelectorAll("[data-product-id]");
  if(!("IntersectionObserver" in window)){
    cards.forEach(card=>gnTrackProductCard(card));
    return;
  }
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        gnTrackProductCard(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  cards.forEach(card=>observer.observe(card));
}

function gnTrackProductCard(card){
  const product = PRODUCTS.find(candidate=>String(candidate.id)===card.dataset.productId);
  if(!product || card.dataset.impressionTracked === "true") return;
  card.dataset.impressionTracked = "true";
  const item = { item_id:String(product.id), item_name:product.name, item_category:product.category, price:product.price, quantity:1 };
  gnTrack("view_item_list", { item_list_name:card.dataset.listName || "Shop", items:[item] }, "ViewContent", {
    content_ids:[String(product.id)], content_type:"product", content_name:product.name, value:product.price, currency:"NPR",
  });
}

gnStartAnalytics();
gnLogMarketingEvent("page_view");

document.addEventListener("click", event=>{
  const target = event.target instanceof Element ? event.target.closest("a, button") : null;
  if(!target) return;
  const label = (target.getAttribute("aria-label") || target.textContent || "").trim().slice(0, 80);
  const parameters = { element_text:label, element_type:target.tagName.toLowerCase() };
  if(target instanceof HTMLAnchorElement && target.href) parameters.link_url = target.href;
  const eventName = target.dataset.track || "click";
  gnTrack(eventName, { ...parameters, label:target.dataset.label || label },
    eventName === "recommendation_click" ? "RecommendationClick" : "Click",
    { element_text:target.dataset.label || label, element_type:parameters.element_type });
});

/* ---------------- WALLETS ---------------- */
const WALLET_STARTING_BALANCES = { customer: 5000, expert: 3000, admin: 0 };
const MERCHANT_USERNAME = "admin";
function getWallets(){
  const wallets = readLS(LS.wallets, {});
  Object.entries(WALLET_STARTING_BALANCES).forEach(([username, balance])=>{
    if(!wallets[username]) wallets[username] = { balance, transactions: [] };
  });
  const session = getSession();
  if(session && !wallets[session.username]){
    const balance = session.role === "customer" ? 5000 : session.role === "expert" ? 3000 : 0;
    wallets[session.username] = { balance, transactions: [] };
  }
  writeLS(LS.wallets, wallets);
  return wallets;
}
function getWallet(username=getSession()?.username){
  if(!username) return { balance: 0, transactions: [] };
  const wallets = getWallets();
  if(!wallets[username]) wallets[username] = { balance: 0, transactions: [] };
  writeLS(LS.wallets, wallets);
  return wallets[username];
}
function getWalletBalance(username=getSession()?.username){ return Number(getWallet(username).balance) || 0; }
function addWalletTransaction(wallet, transaction){
  wallet.transactions.unshift({ ...transaction, date: new Date().toISOString() });
}
function getPaymentHistory(){
  const payments=readLS(LS.payments, []);
  const references=new Set(payments.map(payment=>payment.reference));
  const legacyOrderPayments=readLS(LS.orders, []).filter(order=>
    order.paymentMethod==="wallet" && order.paymentStatus==="paid from GreenNest wallet" && !references.has(order.id)
  ).map(order=>({
    id:"LEGACY-" + order.id,
    type:"Plant and garden order",
    reference:order.id,
    payer:order.customerUsername || "Unknown legacy customer",
    method:"GreenNest wallet (simulated)",
    amount:order.total,
    expertAmount:0,
    adminAmount:order.total,
    status:"Received from local order history (simulated)",
    date:order.date,
  }));
  if(legacyOrderPayments.length){
    const migrated=[...legacyOrderPayments,...payments];
    writeLS(LS.payments,migrated);
    return migrated;
  }
  return payments;
}
function recordPayment(payment){
  const payments = getPaymentHistory();
  if(payments.some(entry=>entry.reference === payment.reference)) return;
  payments.unshift({ ...payment, id:"PAY" + Date.now().toString(36).toUpperCase(), date:new Date().toISOString() });
  writeLS(LS.payments, payments);
}
function isValidEsewaCredentials(esewaId, mpin){
  const walletId = String(esewaId || "").replace(/\D/g, "");
  return /^\d{10}$/.test(walletId) && String(mpin || "") === walletId.slice(0, 4);
}
function topUpWallet(amount, esewaId, mpin){
  const value = Number(amount);
  const walletId = String(esewaId || "").replace(/\D/g, "");
  if(!getSession() || !Number.isSafeInteger(value) || value < 100 || value > 50000 || value % 100 !== 0) return { ok:false, message:"Enter a whole amount between NPR 100 and NPR 50,000 in increments of NPR 100." };
  if(!isValidEsewaCredentials(walletId, mpin)) return { ok:false, message:"Top-up declined. Enter any 10-digit eSewa number and use its first 4 digits as the MPIN." };
  const wallets = getWallets();
  const wallet = wallets[getSession().username] || { balance:0, transactions:[] };
  wallet.balance += value;
  addWalletTransaction(wallet, { type:"credit", amount:value, label:"eSewa top-up", reference:"ES" + Date.now().toString().slice(-8) });
  wallets[getSession().username] = wallet;
  writeLS(LS.wallets, wallets);
  return { ok:true, balance:wallet.balance };
}
function chargeWallet(senderUsername, receiverUsername, amount, reference){
  const value = Number(amount);
  if(!Number.isSafeInteger(value) || value <= 0) return { ok:false, message:"The wallet payment amount is invalid." };
  const wallets = getWallets();
  const sender = wallets[senderUsername] || { balance:0, transactions:[] };
  const receiver = wallets[receiverUsername] || { balance:0, transactions:[] };
  if(sender.balance < value) return { ok:false, message:`Insufficient wallet balance. Available: NPR ${sender.balance.toLocaleString()}.` };
  sender.balance -= value;
  receiver.balance += value;
  addWalletTransaction(sender, { type:"debit", amount:value, label:"Payment to GreenNest", reference });
  addWalletTransaction(receiver, { type:"credit", amount:value, label:`Payment from ${senderUsername}`, reference });
  wallets[senderUsername] = sender;
  wallets[receiverUsername] = receiver;
  writeLS(LS.wallets, wallets);
  recordPayment({
    type:"Plant and garden order",
    reference,
    payer:senderUsername,
    method:"GreenNest wallet (simulated)",
    amount:value,
    expertAmount:0,
    adminAmount:value,
    status:"Received (simulated)",
  });
  return { ok:true, senderBalance:sender.balance, receiverBalance:receiver.balance };
}
function payForExpertBooking(bookingId){
  const session = getSession();
  if(!session || session.role !== "customer") return { ok:false, message:"Sign in as a customer to pay for a booking." };
  const bookings = getBookings();
  const booking = bookings.find(item=>item.id === bookingId && item.customerUsername === session.username);
  if(!booking) return { ok:false, message:"This booking was not found in your account." };
  if(booking.status !== "Accepted") return { ok:false, message:"Payment is available after the expert accepts your booking." };
  if(booking.paymentStatus === "Paid via GreenNest wallet (simulated)") return { ok:false, message:"This booking has already been paid." };
  const expert = EXPERTS.find(item=>item.id === booking.expertId);
  if(!expert || !Number.isSafeInteger(expert.priceAmount) || expert.priceAmount <= 0) return { ok:false, message:"The expert service price is unavailable." };
  const total = expert.priceAmount;
  const adminAmount = Math.round(total * 0.2);
  const expertAmount = total - adminAmount;
  const expertUsername = `expert${expert.id}`;
  const wallets = getWallets();
  const customerWallet = wallets[session.username] || { balance:0, transactions:[] };
  if(customerWallet.balance < total){
    return { ok:false, message:`Insufficient wallet balance. Add NPR ${(total - customerWallet.balance).toLocaleString()} to continue.` };
  }
  const adminWallet = wallets[MERCHANT_USERNAME] || { balance:0, transactions:[] };
  const expertWallet = wallets[expertUsername] || { balance:0, transactions:[] };
  const reference = booking.id;
  customerWallet.balance -= total;
  adminWallet.balance += adminAmount;
  expertWallet.balance += expertAmount;
  addWalletTransaction(customerWallet, { type:"debit", amount:total, label:`Expert booking payment · ${expert.name}`, reference });
  addWalletTransaction(adminWallet, { type:"credit", amount:adminAmount, label:`20% service commission · ${expert.name}`, reference });
  addWalletTransaction(expertWallet, { type:"credit", amount:expertAmount, label:`80% service payout · ${expert.name}`, reference });
  wallets[session.username] = customerWallet;
  wallets[MERCHANT_USERNAME] = adminWallet;
  wallets[expertUsername] = expertWallet;
  writeLS(LS.wallets, wallets);
  recordPayment({
    type:"Expert service",
    reference,
    payer:session.username,
    recipient:expertUsername,
    method:"GreenNest wallet (simulated)",
    amount:total,
    expertAmount,
    adminAmount,
    status:"Received and split (simulated)",
  });
  booking.paymentStatus = "Paid via GreenNest wallet (simulated)";
  booking.paidAt = new Date().toISOString();
  writeLS(LS.bookings, bookings);
  return { ok:true, total, expertAmount, adminAmount, customerBalance:customerWallet.balance };
}
function getUserOrders(username=getSession()?.username){
  return readLS(LS.orders, []).filter(order=>order.customerUsername === username);
}

/* ---------------- CART ---------------- */
function getCart(){ return readLS(userStorageKey(LS.cart), []); }
function setCart(cart){ writeLS(userStorageKey(LS.cart), cart); updateBadges(); }
function addToCart(productId, qty=1){
  const product = PRODUCTS.find(item=>item.id===productId);
  if(!product){ toast("This product is not available."); return false; }
  if(!Number.isSafeInteger(qty) || qty < 1 || qty > 100){ toast("Choose a quantity between 1 and 100."); return false; }
  const cart = getCart();
  const existing = cart.find(i=>i.id===productId);
  const nextQuantity = (existing ? Number(existing.qty) : 0) + qty;
  if(!Number.isSafeInteger(nextQuantity) || nextQuantity > 100){ toast("A maximum of 100 of each product can be ordered."); return false; }
  if(existing){ existing.qty = nextQuantity; } else { cart.push({ id:productId, qty }); }
  setCart(cart);
  const item = { item_id:String(product.id), item_name:product.name, item_category:product.category, price:product.price, quantity:qty };
  gnTrack("add_to_cart", { currency:"NPR", value:product.price*qty, items:[item] }, "AddToCart", {
    content_ids:[String(product.id)], content_type:"product", value:product.price*qty, currency:"NPR",
  });
  toast(`${product.name} added to cart`);
  return true;
}
function removeFromCart(productId){
  setCart(getCart().filter(i=>i.id!==productId));
}
function changeQty(productId, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===productId);
  if(!item || !Number.isSafeInteger(delta) || delta === 0) return;
  const nextQuantity = Number(item.qty) + delta;
  if(!Number.isSafeInteger(nextQuantity)){ toast("This cart quantity is invalid."); return; }
  if(nextQuantity > 100){ toast("A maximum of 100 of each product can be ordered."); return; }
  if(nextQuantity <= 0){ return removeFromCart(productId); }
  item.qty = nextQuantity;
  setCart(cart);
}
function cartCount(){ return getCart().reduce((s,i)=>s+i.qty,0); }
function cartTotal(){
  return getCart().reduce((sum,i)=>{
    const p = PRODUCTS.find(x=>x.id===i.id);
    return sum + (p ? p.price*i.qty : 0);
  },0);
}

/* ---------------- WISHLIST ---------------- */
function getWishlist(){ return readLS(userStorageKey(LS.wishlist), []); }
function toggleWishlist(productId){
  let wl = getWishlist();
  if(wl.includes(productId)){ wl = wl.filter(id=>id!==productId); toast("Removed from wishlist"); }
  else { wl.push(productId); toast("Saved to wishlist"); }
  writeLS(userStorageKey(LS.wishlist), wl);
  updateBadges();
  return wl.includes(productId);
}
function isWishlisted(productId){ return getWishlist().includes(productId); }

/* ---------------- ORDERS (checkout) ---------------- */
function placeOrder(shippingDetails=null, paymentDetails=null){
  const cart = getCart();
  if(cart.length===0) return null;
  if(!shippingDetails || !paymentDetails || !["card", "cash", "wallet"].includes(paymentDetails.method)){
    return { error:"Add delivery details and choose a valid payment method." };
  }
  const expectedPaymentStatus = {
    card:"simulated; no charge collected",
    cash:"payment due on delivery",
    wallet:"paid from GreenNest wallet",
  }[paymentDetails.method];
  if(paymentDetails.status !== expectedPaymentStatus){
    return { error:"Payment status does not match the selected method." };
  }

  const orderItems = cart.map((item)=>{
    const product = PRODUCTS.find((entry)=>entry.id===item.id);
    const quantity = Number(item.qty);
    if(!product || !Number.isSafeInteger(quantity) || quantity < 1){
      return null;
    }
    return { id:product.id, name:product.name, qty:quantity, price:product.price };
  });
  if(orderItems.some((item)=>item === null)){
    return { error:"Your cart contains an invalid item. Remove it and try again." };
  }

  const session = getSession();
  if(!session) return { error:"Please log in before placing your order." };
  const total = orderItems.reduce((sum, item)=>sum + item.price * item.qty, 0);
  const orderId = "GN" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
  if(paymentDetails.method === "wallet"){
    const payment = chargeWallet(session.username, MERCHANT_USERNAME, total, orderId);
    if(!payment.ok) return { error:payment.message };
  }
  const orders = readLS(LS.orders, []);
  const order = {
    id: orderId,
    items:orderItems,
    total,
    paymentMethod:paymentDetails.method,
    paymentStatus:paymentDetails.status,
    date: new Date().toISOString(),
    status:paymentDetails.method === "cash" ? "Awaiting cash on delivery" : paymentDetails.method === "wallet" ? "Paid from GreenNest wallet" : "Card authorization simulated; no charge collected",
    shipping:shippingDetails,
    customerUsername:session.username,
    customerName:session.label,
  };
  const storedOrder = { ...order };
  delete storedOrder.shipping;
  orders.unshift(storedOrder);
  writeLS(LS.orders, orders);
  setCart([]);
  const items = gnProductItems(cart);
  gnTrack("purchase", { transaction_id:order.id, currency:"NPR", value:total, items }, "Purchase", {
    content_ids:items.map(item=>item.item_id), content_type:"product", contents:items.map(item=>({ id:item.item_id, quantity:item.quantity })),
    value:total, currency:"NPR",
  });
  return order;
}

/* ---------------- PURCHASE-BASED RECOMMENDATIONS ---------------- */
function getRecommendedProducts(take=4){
  const session = getSession();
  const orders = readLS(LS.orders, []);
  const purchasesByUser = new Map();
  orders.forEach(order=>{
    if(!order.customerUsername) return;
    if(!purchasesByUser.has(order.customerUsername)) purchasesByUser.set(order.customerUsername, new Set());
    order.items.forEach(item=>purchasesByUser.get(order.customerUsername).add(item.id));
  });

  const mine = session ? (purchasesByUser.get(session.username) || new Set()) : new Set();
  const scores = new Map();
  if(mine.size){
    purchasesByUser.forEach((theirs, username)=>{
      if(username === session.username || !theirs.size) return;
      let overlap = 0;
      mine.forEach(id=>{ if(theirs.has(id)) overlap++; });
      if(!overlap) return;
      const similarity = overlap / Math.sqrt(mine.size * theirs.size);
      theirs.forEach(id=>{
        if(!mine.has(id)) scores.set(id, (scores.get(id) || 0) + similarity);
      });
    });
  }

  const popularity = new Map();
  orders.forEach(order=>order.items.forEach(item=>{
    popularity.set(item.id, (popularity.get(item.id) || 0) + item.qty);
  }));
  const categoryCounts = new Map();
  const relatedScores = new Map();
  mine.forEach(id=>{
    const product = PRODUCTS.find(candidate=>candidate.id===id);
    if(product) categoryCounts.set(product.category, (categoryCounts.get(product.category) || 0) + 1);
    (product?.relatedIds || []).forEach(relatedId=>{
      if(!mine.has(relatedId)) relatedScores.set(relatedId, (relatedScores.get(relatedId) || 0) + 30);
    });
    if(product?.category === "Plants"){
      PRODUCTS.filter(candidate=>["Fertilizers", "Pots", "Gardening tools", "Accessories"].includes(candidate.category))
        .forEach(candidate=>{
          if(!mine.has(candidate.id)){
            const weight = candidate.category === "Fertilizers" ? 5 : candidate.category === "Pots" ? 4 : candidate.category === "Gardening tools" ? 3 : 2;
            relatedScores.set(candidate.id, (relatedScores.get(candidate.id) || 0) + weight);
          }
        });
      const purchasedPlant = product.name.toLowerCase();
      COMPANIONS.forEach(group=>{
        const matchesGroup = group.set.some(name=>purchasedPlant.startsWith(name.toLowerCase()));
        if(!matchesGroup) return;
        PRODUCTS.filter(candidate=>candidate.id !== product.id && group.set.some(name=>candidate.name.toLowerCase().startsWith(name.toLowerCase())))
          .forEach(candidate=>{
            if(!mine.has(candidate.id)) relatedScores.set(candidate.id, (relatedScores.get(candidate.id) || 0) + 20);
          });
      });
    }
  });

  return PRODUCTS
    .filter(product=>!mine.has(product.id))
    .map((product,index)=>({
      product,
      score:(relatedScores.get(product.id) || 0) + (scores.get(product.id) || 0) * 100
        + (categoryCounts.get(product.category) || 0) * 2 + (popularity.get(product.id) || 0)
        + (PRODUCTS.length-index) / 1000,
    }))
    .sort((a,b)=>b.score-a.score)
    .slice(0, Math.max(0, take))
    .map(entry=>entry.product);
}

/* ---------------- MY PLANTS + JOURNAL ---------------- */
function getPlants(){ return readLS(userStorageKey(LS.plants), []); }
function addPlant(plant){
  const plants = getPlants();
  plant.id = "P" + Date.now();
  plant.addedOn = new Date().toISOString();
  plants.unshift(plant);
  writeLS(userStorageKey(LS.plants), plants);
  return plant;
}
function removePlant(plantId){
  writeLS(userStorageKey(LS.plants), getPlants().filter(p=>p.id!==plantId));
  const j = readLS(userStorageKey(LS.journal), {});
  delete j[plantId];
  writeLS(userStorageKey(LS.journal), j);
}
function getJournal(plantId){
  const all = readLS(userStorageKey(LS.journal), {});
  return all[plantId] || [];
}
function addJournalEntry(plantId, note){
  const all = readLS(userStorageKey(LS.journal), {});
  if(!all[plantId]) all[plantId] = [];
  all[plantId].unshift({ note, date: new Date().toISOString() });
  writeLS(userStorageKey(LS.journal), all);
}

/* ---------------- BOOKINGS ---------------- */
function getBookings(){ return readLS(LS.bookings, []); }
function addBooking(booking){
  const bookings = getBookings();
  booking.id = "BK" + Date.now().toString().slice(-8);
  booking.status = "Pending confirmation";
  booking.paymentStatus = "Unpaid — awaiting expert acceptance";
  const storedBooking = { ...booking };
  delete storedBooking.customerEmail;
  delete storedBooking.customerName;
  bookings.unshift(storedBooking);
  writeLS(LS.bookings, bookings);
  gnTrack("generate_lead", { currency:"NPR", value:0, method:"gardening_consultation" }, "Lead", { content_name:"Gardening consultation" });
  return booking;
}
function cancelBooking(bookingId){
  const bookings = getBookings();
  const booking = bookings.find(item=>item.id === bookingId);
  if(booking && booking.paymentStatus === "Paid via GreenNest wallet (simulated)"){
    return { ok:false, message:"Paid bookings cannot be cancelled here. Contact GreenNest support to review a refund." };
  }
  writeLS(LS.bookings, bookings.filter(b=>b.id!==bookingId));
  return { ok:true };
}
function updateBookingStatus(bookingId, status){
  const bookings = getBookings();
  const b = bookings.find(x=>x.id===bookingId);
  if(b?.paymentStatus === "Paid via GreenNest wallet (simulated)" && status === "Rejected"){
    return { ok:false, message:"A paid booking cannot be rejected here. Contact the customer and GreenNest support to review a refund." };
  }
  if(b) b.status = status;
  writeLS(LS.bookings, bookings);
  return { ok:true };
}
async function getEmailApiBase(){
  if(!["5500", "5501"].includes(window.location.port)) return "";
  try{
    const response = await fetch("/api/health", { cache:"no-store" });
    if(response.ok) return "";
    if(response.status !== 404) throw new Error("Unable to check the local email service.");
  }catch(error){
    if(!(error instanceof TypeError)) throw error;
  }
  return `${window.location.protocol}//localhost:3000`;
}
async function emailBookingRequest(booking){
  const apiBase = await getEmailApiBase();
  const response = await fetch(`${apiBase}/api/bookings/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  const result = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(result.error || "Unable to send booking email.");
  return result;
}

async function emailOrderConfirmation(order){
  const emailOrder = {
    ...order,
    items: Array.isArray(order.items) ? order.items.map(item => {
      const product = PRODUCTS.find(candidate => candidate.id === item.id);
      return {
        ...item,
        name: product?.name || `Product ${item.id}`,
        price: product?.price || 0,
        image: product?.image || "",
      };
    }) : order.items,
  };
  const apiBase = await getEmailApiBase();
  const response = await fetch(`${apiBase}/api/orders/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailOrder),
  });
  const result = await response.json().catch(() => ({}));
  if(!response.ok) throw new Error(result.error || "Unable to send order email.");
  return result;
}

/* ---------------- CSV EXPORT (used by Admin > Generate Reports) ---------------- */
function downloadCSV(filename, rows){
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ---------------- TOASTS ---------------- */
function toast(msg){
  let holder = document.getElementById("toast-holder");
  if(!holder){
    holder = document.createElement("div");
    holder.id = "toast-holder";
    document.body.appendChild(holder);
  }
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  holder.appendChild(el);
  setTimeout(()=>{ el.style.opacity="0"; el.style.transition="opacity .3s"; setTimeout(()=>el.remove(),300); }, 2400);
}

/* ---------------- NAV BADGES ---------------- */
function updateBadges(){
  const cartBadge = document.getElementById("cart-badge");
  const wlBadge = document.getElementById("wishlist-badge");
  if(cartBadge){
    const c = cartCount();
    cartBadge.textContent = c;
    cartBadge.style.display = c>0 ? "flex" : "none";
  }
  if(wlBadge){
    const w = getWishlist().length;
    wlBadge.textContent = w;
    wlBadge.style.display = w>0 ? "flex" : "none";
  }
}

/* ---------------- MODAL HELPERS ---------------- */
function openModal(id){ document.getElementById(id).classList.add("open"); }
function closeModal(id){ document.getElementById(id).classList.remove("open"); }
document.addEventListener("click", (e)=>{
  if(e.target.classList && e.target.classList.contains("modal-overlay")){
    e.target.classList.remove("open");
  }
});
document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape"){
    document.querySelectorAll(".modal-overlay.open").forEach(m=>m.classList.remove("open"));
    document.querySelectorAll(".drawer.open").forEach(d=>d.classList.remove("open"));
    document.querySelectorAll(".drawer-overlay.open").forEach(d=>d.classList.remove("open"));
  }
});

/* ---------------- CART DRAWER (shared markup injected on every page) ---------------- */
function renderCartDrawer(){
  const body = document.getElementById("cart-drawer-body");
  const footTotal = document.getElementById("cart-drawer-total");
  if(!body) return;
  const cart = getCart();
  if(cart.length===0){
    body.innerHTML = `<div class="empty-state">🛒<br>Your cart is empty.<br>Browse the shop to add plants and supplies.</div>`;
  }else{
    body.innerHTML = cart.map(i=>{
      const p = PRODUCTS.find(x=>x.id===i.id);
      if(!p) return "";
      return `
        <div class="cart-row">
          <div class="thumb"><img src="${p.image}" alt="${p.name}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;" /></div>
          <div class="info">
            <div class="name">${p.name}</div>
            <div class="price">NPR ${p.price} × ${i.qty}</div>
          </div>
          <div class="qty-ctrl">
            <button onclick="changeQty(${p.id},-1); renderCartDrawer();">−</button>
            <span>${i.qty}</span>
            <button onclick="changeQty(${p.id},1); renderCartDrawer();">+</button>
          </div>
          <button class="remove-x" onclick="removeFromCart(${p.id}); renderCartDrawer();">Remove</button>
        </div>`;
    }).join("");
  }
  if(footTotal) footTotal.textContent = "NPR " + cartTotal().toLocaleString();
}

function checkoutNow(){
  if(getCart().length===0){ toast("Your cart is empty"); return; }
  window.location.href = "checkout.html";
}

function openDrawer(id){
  document.getElementById(id).classList.add("open");
  document.getElementById(id+"-overlay").classList.add("open");
  if(id==="cart-drawer") renderCartDrawer();
}
function closeDrawer(id){
  document.getElementById(id).classList.remove("open");
  document.getElementById(id+"-overlay").classList.remove("open");
}

/* ---------------- NAV: mobile hamburger ---------------- */
function toggleNav(){
  const navLinks = document.getElementById("navlinks");
  if(navLinks) navLinks.classList.toggle("open");
}

/* run on every page load */
document.addEventListener("DOMContentLoaded", ()=>{
  ensureAuthUI();
  checkPageAccess();
  updateBadges();
  gnRenderMarketingPanel();
});
