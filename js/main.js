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
  plants: "greennest_plants",
  session: "greennest_session",
};

const DEMO_USERS = {
  admin: { username: "admin", password: "admin", role: "admin", label: "Admin" },
  customer: { username: "customer", password: "customer", role: "customer", label: "Customer" },
  expert: { username: "expert", password: "expert", role: "expert", label: "Expert" },
};

function getSession(){ return readLS(LS.session, null); }
function setSession(user){ writeLS(LS.session, user); }
function clearSession(){ localStorage.removeItem(LS.session); }
function getUserHome(role){
  if(role === "admin") return "admin.html";
  if(role === "expert") return "expert-panel.html";
  return "index.html";
}
function loginDemoUser(username, role, password){
  const roleKey = String(role || "").trim().toLowerCase();
  const user = DEMO_USERS[roleKey];
  if(!user) return false;
  if(String(username || "").trim().toLowerCase() !== user.username) return false;
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

/* ---------------- CART ---------------- */
function getCart(){ return readLS(LS.cart, []); }
function setCart(cart){ writeLS(LS.cart, cart); updateBadges(); }
function addToCart(productId, qty=1){
  const cart = getCart();
  const existing = cart.find(i=>i.id===productId);
  if(existing){ existing.qty += qty; } else { cart.push({ id:productId, qty }); }
  setCart(cart);
  const p = PRODUCTS.find(x=>x.id===productId);
  toast(`${p ? p.name : "Item"} added to cart`);
}
function removeFromCart(productId){
  setCart(getCart().filter(i=>i.id!==productId));
}
function changeQty(productId, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===productId);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0){ return removeFromCart(productId); }
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
function getWishlist(){ return readLS(LS.wishlist, []); }
function toggleWishlist(productId){
  let wl = getWishlist();
  if(wl.includes(productId)){ wl = wl.filter(id=>id!==productId); toast("Removed from wishlist"); }
  else { wl.push(productId); toast("Saved to wishlist"); }
  writeLS(LS.wishlist, wl);
  updateBadges();
  return wl.includes(productId);
}
function isWishlisted(productId){ return getWishlist().includes(productId); }

/* ---------------- ORDERS (checkout) ---------------- */
function placeOrder(){
  const cart = getCart();
  if(cart.length===0) return null;
  const orders = readLS(LS.orders, []);
  const order = {
    id: "GN" + Date.now().toString().slice(-8),
    items: cart,
    total: cartTotal(),
    date: new Date().toISOString(),
  };
  orders.unshift(order);
  writeLS(LS.orders, orders);
  setCart([]);
  return order;
}

/* ---------------- MY PLANTS + JOURNAL ---------------- */
function getPlants(){ return readLS(LS.plants, []); }
function addPlant(plant){
  const plants = getPlants();
  plant.id = "P" + Date.now();
  plant.addedOn = new Date().toISOString();
  plants.unshift(plant);
  writeLS(LS.plants, plants);
  return plant;
}
function removePlant(plantId){
  writeLS(LS.plants, getPlants().filter(p=>p.id!==plantId));
  const j = readLS(LS.journal, {});
  delete j[plantId];
  writeLS(LS.journal, j);
}
function getJournal(plantId){
  const all = readLS(LS.journal, {});
  return all[plantId] || [];
}
function addJournalEntry(plantId, note){
  const all = readLS(LS.journal, {});
  if(!all[plantId]) all[plantId] = [];
  all[plantId].unshift({ note, date: new Date().toISOString() });
  writeLS(LS.journal, all);
}

/* ---------------- BOOKINGS ---------------- */
function getBookings(){ return readLS(LS.bookings, []); }
function addBooking(booking){
  const bookings = getBookings();
  booking.id = "BK" + Date.now().toString().slice(-8);
  booking.status = "Pending confirmation";
  bookings.unshift(booking);
  writeLS(LS.bookings, bookings);
  return booking;
}
function cancelBooking(bookingId){
  writeLS(LS.bookings, getBookings().filter(b=>b.id!==bookingId));
}
function updateBookingStatus(bookingId, status){
  const bookings = getBookings();
  const b = bookings.find(x=>x.id===bookingId);
  if(b) b.status = status;
  writeLS(LS.bookings, bookings);
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
  const order = placeOrder();
  if(!order){ toast("Your cart is empty"); return; }
  renderCartDrawer();
  toast(`Order ${order.id} placed — NPR ${order.total.toLocaleString()}`);
  closeDrawer("cart-drawer");
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
});
