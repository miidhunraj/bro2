/* =========================================================
   Broccoli Club · single file
   Part 1: data layer (window.BC) — full CRUD via Supabase
   Part 2: admin app / site app (switches on body[data-app])
   ========================================================= */

/* ==================== PART 1 — DATA LAYER ==================== */
(function (w) {
'use strict';

/* ---------- PASTE YOUR SUPABASE KEYS HERE ---------- */
const CONFIG = {
  // Configure Supabase here once. Use the Project URL and PUBLIC anon/publishable key only.
  // Never place a service_role or secret key in frontend code.
  SUPABASE_URL: 'https://kjharewgwsbswkxbxghp.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqaGFyZXdnd3Nic3dreGJ4Z2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyMDkzMjAsImV4cCI6MjEwODc4NTMyMH0.pQ7S-T_uncf0Eoy3H0jaEvMq64W35hx5M1-cR2qkkNA'
};
/* --------------------------------------------------- */

const LS = { content:'bc.content', settings:'bc.settings', products:'bc.products', categories:'bc.categories',
  reviews:'bc.reviews', orders:'bc.orders', pages:'bc.pages', cart:'bc.cart', favs:'bc.favs', lastOrder:'bc.lastOrder' };

const read  = (k,f) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):f } catch { return f } };
const write = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)) } catch {} };
const clone = o => JSON.parse(JSON.stringify(o));
const uuid  = () => { try { return crypto.randomUUID() } catch { return 'id-'+Date.now()+'-'+Math.random().toString(16).slice(2) } };

const DEF_HOURS = Array.from({length:7}, () => ({ o:'11:00', c:'23:00' }));

const DEF_CONTENT = {
  heroKicker:'CLOUD KITCHEN · COOKED TO ORDER',
  heroTitle:'GOOD FOOD.\nBETTER MOOD.',
  heroSub:'Big flavour, honest cooking and feel-good plates, made for your kind of day.',
  heroVideo:'https://ik.imagekit.io/holabrownie/Broccoli/Video/Broccoli2.mp4',
  marquee:'FRESH DAILY · SLOW COOKED · REAL INGREDIENTS · MADE TO ORDER · NO SHORTCUTS · ',
  specialsKicker:'TODAY AT THE CLUB', specialsTitle:'CLUB SPECIALS',
  storyKicker:'WHY WE COOK', storyTitle:'A LITTLE GREENER.\nA LOT MORE FLAVOUR.',
  storyText:'We started Broccoli Club because everyday food deserves better than a shrug. Everything is cooked after you order, seasoned properly and packed to travel well.',
  storyImage:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=80',
  storyPoints:['Cooked fresh after you order','Produce picked from local markets','Packed to arrive hot and tidy'],
  shopName:'Broccoli Club · Cloud Kitchen', address:'12 Market Lane, Bengaluru 560001',
  mapsQuery:'12 Market Lane Bengaluru', phone:'+91 90000 00000', email:'hello@broccoli.club',
  instagram:'', footerNote:'Good food. Better mood.', hours: clone(DEF_HOURS)
};

const DEF_SETTINGS = { whatsapp:'919000000000', currency:'₹', deliveryFee:39, freeDeliveryOver:599, minOrder:149,
  promoCode:'CLUB10', promoPercent:10, deliveryEta:'35-45 min', pickupEta:'20-25 min',
  acceptingOrders:true };

const DEF_CATEGORIES = ['Bowls','Plates','Wraps','Sides','Drinks','Desserts'];
const CATEGORY_DEFAULTS = {
  Bowls:   { image:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85', description:'Fresh, colourful bowls made to nourish.' },
  Plates:  { image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85', description:'Comforting plates, full of flavour.' },
  Wraps:   { image:'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=85', description:'Fresh wraps with a satisfying crunch.' },
  Sides:   { image:'https://images.unsplash.com/photo-1599588663375-d4726286f4a8?auto=format&fit=crop&w=900&q=85', description:'Little extras, big flavour.' },
  Drinks:  { image:'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?auto=format&fit=crop&w=900&q=85', description:'Cool sips and refreshing favourites.' },
  Desserts:{ image:'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=900&q=85', description:'A sweet finish to your meal.' }
};
const categoryImage = c => (c && c.image_url) || CATEGORY_DEFAULTS[c?.name]?.image || '';
const categoryDescription = c => (c && c.description) || CATEGORY_DEFAULTS[c?.name]?.description || 'Explore the latest from our kitchen.';
const IMG = n => `https://images.unsplash.com/photo-${n}?auto=format&fit=crop&w=900&q=80`;
const DEF_PRODUCTS = [
  {name:'Green Goddess Bowl',description:'Herb-dressed grains, avocado, cucumber ribbons and toasted seeds.',price:249,category:'Bowls',image:IMG('1512621776951-a57141f2eefd'),veg:true,available:true,featured:true,sort_order:1},
  {name:'Roasted Harvest Plate',description:'Slow-roasted roots, butter beans and a sharp lemon dressing.',price:289,category:'Plates',image:IMG('1547592180-85f173990554'),veg:true,available:true,featured:true,sort_order:2},
  {name:'Club Crunch Wrap',description:'Crisp greens, pickled onion and a cool herb sauce in a soft wrap.',price:199,category:'Wraps',image:IMG('1626700051175-6818013e1d4f'),veg:true,available:true,featured:true,sort_order:3},
  {name:'Market Fresh Salad',description:'Whatever is best this week, tossed with a bright citrus finish.',price:219,category:'Bowls',image:IMG('1540420773420-3366772f4999'),veg:true,available:true,featured:false,sort_order:4},
  {name:'Smoked Chilli Rice',description:'Wok-tossed rice, smoked chilli butter and spring onion.',price:269,category:'Plates',image:IMG('1512058564366-18510be2db19'),veg:true,available:true,featured:true,sort_order:5},
  {name:'Crispy Chicken Club',description:'Buttermilk-brined chicken, slaw and garlic aioli in a toasted roll.',price:279,category:'Wraps',image:IMG('1606755962773-d324e0a13086'),veg:false,available:true,featured:false,sort_order:6},
  {name:'Herb Butter Corn',description:'Charred corn, herb butter and a squeeze of lime.',price:149,category:'Sides',image:IMG('1599588663375-d4726286f4a8'),veg:true,available:true,featured:false,sort_order:7},
  {name:'Cold Pressed Lime',description:'Lime, mint and a pinch of salt. Nothing else.',price:99,category:'Drinks',image:IMG('1622597467836-f3285f2131b8'),veg:true,available:true,featured:false,sort_order:8},
  {name:'Dark Cocoa Pot',description:'Slow-set dark chocolate cream with a salted crumb.',price:159,category:'Desserts',image:IMG('1541783245831-57d6fb0926d3'),veg:true,available:true,featured:false,sort_order:9}
];

const API = {
  config: CONFIG, client: null, online: false, uuid,
  categoryImage, categoryDescription,
  configure(url, anonKey) {
    const cleanUrl = String(url || '').trim().replace(/\/$/, '');
    const cleanKey = String(anonKey || '').trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cleanUrl) || !cleanKey) throw new Error('Enter a valid Supabase project URL and anon/public key.');
    CONFIG.SUPABASE_URL = cleanUrl; CONFIG.SUPABASE_ANON_KEY = cleanKey;
    this.client = null; this.online = false; return this.init();
  },
  init () {
    const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(CONFIG.SUPABASE_URL) &&
      !!CONFIG.SUPABASE_ANON_KEY && !/YOUR[_-]|REPLACE|PLACEHOLDER/i.test(CONFIG.SUPABASE_ANON_KEY);
    if (configured && w.supabase && w.supabase.createClient) {
      try { this.client = w.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY); this.online = true; }
      catch { this.online = false; this.client = null; }
    } else { this.client = null; this.online = false; }

    return this;
  },

  async getContent () {
    const local = read(LS.content, null) || clone(DEF_CONTENT);
    if (!this.online) return local;
    try { const { data, error } = await this.client.from('bc_content').select('data').eq('id',1).maybeSingle();
      if (error) throw error;
      if (data && data.data && Object.keys(data.data).length) { write(LS.content, data.data); return data.data; }
      await this.client.from('bc_content').upsert({ id:1, data: local }); return local;
    } catch { return local; }
  },
  async saveContent (patch) {
    const current = read(LS.content, clone(DEF_CONTENT));
    const merged = Object.assign({}, current, patch);

    if (this.online) {
      const { error } = await this.client
        .from('bc_content')
        .upsert(
          {
            id: 1,
            data: merged,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Supabase content save failed:', error);
        throw new Error(error.message || 'Could not save shop details.');
      }
    }

    write(LS.content, merged);
    return merged;
  },

  async getSettings () {
    const local = Object.assign(clone(DEF_SETTINGS), read(LS.settings, {}));
    if (!this.online) return local;
    try { const { data, error } = await this.client.from('bc_settings').select('data').eq('id',1).maybeSingle();
      if (error) throw error;
      if (data && data.data && Object.keys(data.data).length) { const m = Object.assign(clone(DEF_SETTINGS), data.data); write(LS.settings, m); return m; }
      await this.client.from('bc_settings').upsert({ id:1, data: local }); return local;
    } catch { return local; }
  },
  async saveSettings (patch) {
    const current = Object.assign(
      clone(DEF_SETTINGS),
      read(LS.settings, {})
    );
    const merged = Object.assign({}, current, patch);

    if (this.online) {
      const { error } = await this.client
        .from('bc_settings')
        .upsert(
          {
            id: 1,
            data: merged,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'id' }
        );

      if (error) {
        console.error('Supabase settings save failed:', error);
        throw new Error(error.message || 'Could not save settings.');
      }
    }

    write(LS.settings, merged);
    return merged;
  },

  async getCategories () {
    const local = read(LS.categories, null) || DEF_CATEGORIES.map((n,i)=>({id:uuid(),name:n,sort_order:i,active:true,image_url:CATEGORY_DEFAULTS[n]?.image||'',description:CATEGORY_DEFAULTS[n]?.description||''}));
    write(LS.categories, local);
    if (!this.online) return local;
    try { const { data, error } = await this.client.from('bc_categories').select('*').order('sort_order');
      if (error) throw error;
      if (data && data.length) { const normalized=data.map(c=>({...c,image_url:c.image_url||CATEGORY_DEFAULTS[c.name]?.image||'',description:c.description||CATEGORY_DEFAULTS[c.name]?.description||''})); write(LS.categories, normalized); return normalized; }
      for (const c of local) { await this.client.from('bc_categories').upsert({ id:c.id, name:c.name, sort_order:c.sort_order, active:true, image_url:c.image_url||CATEGORY_DEFAULTS[c.name]?.image||'', description:c.description||CATEGORY_DEFAULTS[c.name]?.description||'' }); }
      return local;
    } catch { return local; }
  },
  async saveCategory (cat) {
    const list = read(LS.categories, []); const i = list.findIndex(c => c.id === cat.id);
    if (i > -1) list[i] = Object.assign(list[i], cat); else list.push(cat); write(LS.categories, list);
    if (this.online) { try { await this.client.from('bc_categories').upsert(cat); } catch {} }
    return list;
  },
  async deleteCategory (id) {
    const list = read(LS.categories, []).filter(c => c.id !== id); write(LS.categories, list);
    if (this.online) { try { await this.client.from('bc_categories').delete().eq('id', id); } catch {} }
    return list;
  },

  async getProducts () {
    const local = read(LS.products, null);
    if (this.online) {
      try {
        const { data, error } = await this.client.from('bc_products').select('*').order('sort_order');
        if (error) throw error;
        if (data && data.length) { write(LS.products, data); return data; }
        const seeded = local && local.length ? local : DEF_PRODUCTS.map(p => Object.assign({ id: uuid() }, p));
        write(LS.products, seeded);
        for (const item of seeded) {
          try { const result = await this.client.from('bc_products').upsert(item); if (result.error) break; }
          catch { break; }
        }
        return seeded;
      } catch {
        if (local) return local;
      }
    }
    if (local) return local;
    const seeded = DEF_PRODUCTS.map(p => Object.assign({ id: uuid() }, p));
    write(LS.products, seeded);
    return seeded;
  },
  async _refreshProducts () {
    try { const { data, error } = await this.client.from('bc_products').select('*').order('sort_order'); if (!error && data) write(LS.products, data); } catch {}
  },
  async saveProduct (p) {
    const list = read(LS.products, []); const i = list.findIndex(x => x.id === p.id);
    if (i > -1) list[i] = Object.assign(list[i], p); else list.push(p); write(LS.products, list);
    if (this.online) { try { await this.client.from('bc_products').upsert(p); } catch {} }
    return list;
  },
  async deleteProduct (id) {
    const list = read(LS.products, []).filter(x => x.id !== id); write(LS.products, list);
    if (this.online) { try { await this.client.from('bc_products').delete().eq('id', id); } catch {} }
    return list;
  },

  async getReviews () {
    const local = read(LS.reviews, []);
    if (this.online) { try { const { data, error } = await this.client.from('bc_reviews').select('*').order('created_at',{ascending:false}); if (!error && data) { write(LS.reviews,data); return data; } } catch {} }
    return local;
  },
  async addReview (r) {
    const row = Object.assign({ id:uuid(), created_at:new Date().toISOString(), status:'PENDING' }, r);
    const list = read(LS.reviews, []); list.unshift(row); write(LS.reviews, list);
    if (this.online) { try { await this.client.from('bc_reviews').insert({ name:row.name, rating:row.rating, text:row.text, status:row.status }); } catch {} }
    return list;
  },
  async saveReview (r) {
    const list = read(LS.reviews, []); const i = list.findIndex(x => x.id === r.id);
    if (i > -1) list[i] = Object.assign(list[i], r); else list.push(r); write(LS.reviews, list);
    if (this.online) { try { await this.client.from('bc_reviews').upsert(r); } catch {} }
    return list;
  },
  async deleteReview (id) {
    const list = read(LS.reviews, []).filter(x => x.id !== id); write(LS.reviews, list);
    if (this.online) { try { await this.client.from('bc_reviews').delete().eq('id', id); } catch {} }
    return list;
  },

  async getOrders () {
    const local = read(LS.orders, []);
    if (this.online) { try { const { data, error } = await this.client.from('bc_orders').select('*, bc_order_items(*)').order('created_at',{ascending:false}); if (!error && data) { write(LS.orders,data); return data; } } catch {} }
    return local;
  },
  async createOrder (order) {
    const list = read(LS.orders, []); list.unshift(order); write(LS.orders, list);
    if (this.online) {
      try {
        await this.client.from('bc_orders').insert({ id:order.id, type:order.type, customer:order.customer,
          subtotal:order.subtotal, discount:order.discount, promo:order.promo, delivery_fee:order.deliveryFee,
          total:order.total, status:order.status, message:order.message });
        if (order.items && order.items.length) {
          await this.client.from('bc_order_items').insert(order.items.map(i => ({ order_id:order.id, name:i.name, qty:i.qty, price:i.price, note:i.note||'' })));
        }
      } catch {}
    }
    return list;
  },
  async saveOrder (o) {
    const list = read(LS.orders, []); const i = list.findIndex(x => x.id === o.id);
    if (i > -1) list[i] = Object.assign(list[i], o); write(LS.orders, list);
    if (this.online) { try { await this.client.from('bc_orders').upsert({ id:o.id, status:o.status, type:o.type, customer:o.customer, subtotal:o.subtotal, discount:o.discount, promo:o.promo, delivery_fee:o.deliveryFee, total:o.total, message:o.message }); } catch {} }
    return list;
  },
  async deleteOrder (id) {
    const list = read(LS.orders, []).filter(x => x.id !== id); write(LS.orders, list);
    if (this.online) { try { await this.client.from('bc_orders').delete().eq('id', id); } catch {} }
    return list;
  },

  async getPages () {
    const local = read(LS.pages, []);
    if (this.online) { try { const { data, error } = await this.client.from('bc_pages').select('*').order('sort_order'); if (!error && data) { write(LS.pages,data); return data; } } catch {} }
    return local;
  },
  async savePage (p) {
    const list = read(LS.pages, []); const i = list.findIndex(x => x.id === p.id);
    if (i > -1) list[i] = Object.assign(list[i], p); else list.push(p); write(LS.pages, list);
    if (this.online) { try { await this.client.from('bc_pages').upsert(p); } catch {} }
    return list;
  },
  async deletePage (id) {
    const list = read(LS.pages, []).filter(x => x.id !== id); write(LS.pages, list);
    if (this.online) { try { await this.client.from('bc_pages').delete().eq('id', id); } catch {} }
    return list;
  },

  getCart () { return read(LS.cart, []) }, setCart (c) { write(LS.cart, c) },
  getFavs () { return read(LS.favs, []) }, setFavs (f) { write(LS.favs, f) },
  getLastOrder () { return read(LS.lastOrder, null) },
  setLastOrder (o) { try { o ? write(LS.lastOrder, o) : localStorage.removeItem(LS.lastOrder) } catch {} }
};

w.BC = API;
})(window);


/* ==================== PART 2 — APPS ==================== */
'use strict';

const IS_ADMIN = document.body.dataset.app === 'admin';
const $  = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const digits = s => String(s||'').replace(/[^\d]/g,'');
// These helpers live in the data-layer closure; expose safe wrappers to both site and admin renderers.
const categoryImage = c => BC.categoryImage(c);
const categoryDescription = c => BC.categoryDescription(c);

function toast (m) {
  const t = $('#toast'); if (!t) return;
  t.textContent = m; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2400);
}
function openSheet (html) {
  const el = $('#sheet'); if (!el) return;
  el.innerHTML = `<div class="sheet-backdrop" data-x="close"></div><div class="sheet">${html}</div>`;
  el.classList.add('open'); document.body.classList.add('locked');
}
function closeSheet () {
  const el = $('#sheet'); if (!el) return;
  el.classList.remove('open'); el.innerHTML=''; document.body.classList.remove('locked');
}


if (IS_ADMIN) {
/* =========================================================
   ADMIN APP
   ========================================================= */
const DAYS_S = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const fmt = iso => new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const A = { content:{}, settings:{}, products:[], categories:[], reviews:[], orders:[], pages:[],
  tab:'dashboard', authed:false, q:'', filter:'ALL', authUser:null };
const money = n => (A.settings.currency||'₹') + Number(n||0).toLocaleString('en-IN');
const touch = () => {};

async function hasAdminAccess(user) {
  if (!BC.online || !user) return false;
  try {
    const { data, error } = await BC.client.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Admin membership check failed:', error);
    return false;
  }
}

async function signIn(email, password) {
  if (!BC.online) { toast('Configure Supabase URL and anon key first'); return false; }
  if (!email || !password) { toast('Enter your admin email and password'); return false; }
  try {
    const { data, error } = await BC.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!(await hasAdminAccess(data.user))) {
      await BC.client.auth.signOut();
      toast('This account is not an authorised admin');
      return false;
    }
    A.authUser = data.user;
    A.authed = true;
    return true;
  } catch (error) {
    console.error('Admin sign-in failed:', error);
    toast(error?.message || 'Unable to sign in');
    return false;
  }
}

async function signOut() {
  try { if (BC.online) await BC.client.auth.signOut(); } catch (error) { console.error(error); }
  A.authUser = null;
  A.authed = false;
}

const TABS = [['dashboard','Dashboard'],['orders','Orders'],['menu','Menu'],['categories','Categories'],
  ['reviews','Reviews'],['pages','Pages'],['content','Content'],['shop','Shop'],['promo','Promo'],['settings','Settings']];

function gate () {
  return `<div class="gate"><form class="gate-card" id="admin-login-form">
    <div class="mark" style="border-color:var(--forest);color:var(--forest)">BC</div>
    <h1>Kitchen<br>dashboard.</h1>
    <p>Sign in with your authorised administrator account.</p>
    <label class="field"><span>Admin email</span><input id="email" type="email" autocomplete="username" placeholder="admin@example.com" required></label>
    <label class="field"><span>Password</span><input id="code" type="password" autocomplete="current-password" placeholder="Password" required></label>
    <button class="btn dark wide" style="margin-top:16px" type="submit">Sign in</button>
    <a class="btn outline wide" style="margin-top:8px" href="index.html">Back to site</a>
  </form></div>`;
}

function shell () {
  return `<div class="admin-top">
    <div class="mark">BC</div>
    <div class="row"><h1>${esc((TABS.find(t=>t[0]===A.tab)||['','Dashboard'])[1])}</h1>
      <span class="chip ${BC.online?'':'off'}"><i></i>${BC.online?'Supabase live':'Local only'}</span></div>
    <div class="row"><a class="btn tiny outline" href="index.html">View site</a>
      <button class="btn tiny danger" data-x="logout">Sign out</button></div>
  </div>
  <div class="admin-tabs">${TABS.map(([k,l])=>`<button class="${A.tab===k?'active':''}" data-x="tab" data-tab="${k}">${l}</button>`).join('')}</div>
  <div class="section">${panel()}</div>`;
}

function panel () {
  switch (A.tab) {
    case 'orders': return ordersP(); case 'menu': return adminMenuP(); case 'categories': return catP();
    case 'reviews': return reviewP(); case 'pages': return pagesP(); case 'content': return contentP();
    case 'shop': return shopP(); case 'promo': return promoP(); case 'settings': return settingsP();
    default: return dashP();
  }
}

function dashP () {
  const today = new Date().toDateString();
  const t = A.orders.filter(o => new Date(o.created_at).toDateString() === today);
  const rev = t.reduce((s,o)=>s+Number(o.total||0),0);
  return `<div class="stats">
    <div class="stat"><span>Orders today</span><b>${t.length}</b></div>
    <div class="stat"><span>Revenue today</span><b>${money(rev)}</b></div>
    <div class="stat"><span>Live items</span><b>${A.products.filter(p=>p.available).length}</b></div>
    <div class="stat"><span>Pending reviews</span><b>${A.reviews.filter(r=>r.status==='PENDING').length}</b></div>
  </div>
  <div class="admin-sec"><h2>Quick actions</h2><p class="hint">Everything is in the tabs above.</p>
    <div class="row" style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn tiny outline" data-x="tab" data-tab="menu">Menu</button>
      <button class="btn tiny outline" data-x="tab" data-tab="orders">Orders</button>
      <button class="btn tiny outline" data-x="tab" data-tab="reviews">Reviews</button>
      <button class="btn tiny outline" data-x="tab" data-tab="content">Homepage</button></div></div>
  <div class="admin-sec"><h2>WhatsApp destination</h2>
    <p class="hint">Orders go to <b>${esc(A.settings.whatsapp||'not set')}</b>.</p>
    <a class="btn tiny outline" target="_blank" rel="noreferrer" href="https://wa.me/${digits(A.settings.whatsapp)}">Test number</a></div>
  <div class="admin-sec"><h2>Database</h2>
    <p class="hint">${BC.online?'Supabase connected — authorised changes sync to your database.':'Supabase is not configured. Add the project URL and public key in app.js.'}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn tiny outline" data-x="pull">Pull latest</button>
      <button class="btn tiny danger" data-x="reset">Reset local cache</button></div></div>`;
}

function ordersP () {
  const list = A.orders.filter(o => A.filter==='ALL' || o.status===A.filter);
  return `<div class="admin-sec"><h2>Orders</h2><p class="hint">Full receipts as sent from the site.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap">${['ALL','NEW','DONE','CANCELLED'].map(f=>`<button class="btn tiny ${A.filter===f?'dark':'outline'}" data-x="filter" data-f="${f}">${f}</button>`).join('')}</div></div>
  ${list.length ? list.map(o=>`<div class="order-card">
    <div class="oh"><div><div class="oid">${esc(o.id)}</div>
      <span class="small muted">${esc(fmt(o.created_at))} · ${esc(o.type)} · ${esc(o.customer?.name||'')}</span></div>
      <span class="status-pill ${esc(o.status)}">${esc(o.status)}</span></div>
    <pre>${esc(o.message||'')}</pre>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button class="btn tiny outline" data-x="ostat" data-id="${esc(o.id)}" data-s="NEW">New</button>
      <button class="btn tiny outline" data-x="ostat" data-id="${esc(o.id)}" data-s="DONE">Done</button>
      <button class="btn tiny outline" data-x="ostat" data-id="${esc(o.id)}" data-s="CANCELLED">Cancel</button>
      <button class="btn tiny outline" data-x="ocopy" data-id="${esc(o.id)}">Copy</button>
      <button class="btn tiny danger" data-x="odel" data-id="${esc(o.id)}">Delete</button></div></div>`).join('')
    : `<div class="empty"><h3>No orders here</h3><p>They'll show up the moment someone checks out.</p></div>`}`;
}

function adminMenuP () {
  const q = A.q.toLowerCase();
  const list = A.products.filter(p => !q || (p.name+' '+p.category).toLowerCase().includes(q));
  return `<div class="admin-sec"><h2>Menu items</h2>
    <p class="hint">${A.products.length} items · ${A.products.filter(p=>p.available).length} live.</p>
    <input class="search" id="mq" value="${esc(A.q)}" placeholder="Search items">
    <div style="margin-top:12px"><button class="btn tiny dark" data-x="new-product">+ Add item</button></div></div>
  ${list.map(p=>`<div class="admin-item ${p.available?'':'off'}"><img src="${esc(p.image)}" alt="">
    <div><b style="font-size:13px">${esc(p.name)}</b>
      <span class="meta">${esc(p.category)} · ${money(p.price)} · ${p.available?'Live':'Hidden'}${p.featured?' · Special':''}${p.veg?' · Veg':''}</span></div>
    <div class="acts">
      <button data-x="edit-product" data-id="${esc(p.id)}">Edit</button>
      <button data-x="toggle-avail" data-id="${esc(p.id)}">${p.available?'Hide':'Show'}</button>
      <button data-x="toggle-feat" data-id="${esc(p.id)}">${p.featured?'★':'☆'}</button>
      <button class="del" data-x="del-product" data-id="${esc(p.id)}">Del</button></div></div>`).join('')}`;
}

function catP () {
  const used = A.products.reduce((a,p)=>{ a[p.category]=(a[p.category]||0)+1; return a; },{});
  return `<div class="admin-sec"><h2>Categories</h2><p class="hint">Drive the filter chips and item picker.</p>
    <button class="btn tiny dark" data-x="new-cat">+ Add category</button></div>
  ${A.categories.length ? A.categories.slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(c=>`<div class="admin-item">
    <div class="admin-cat-thumb">${categoryImage(c)?`<img src="${esc(categoryImage(c))}" alt="" loading="lazy">`:`<span>${esc(c.name.slice(0,2).toUpperCase())}</span>`}</div>
    <div><b style="font-size:13px">${esc(c.name)}</b><span class="meta">Order ${c.sort_order||0} · ${c.active===false?'Hidden':'Visible'} · ${used[c.name]||0} item(s)</span><span class="meta">${esc(c.description||'No description yet')}</span></div>
    <div class="acts"><button data-x="edit-cat" data-id="${esc(c.id)}">Edit</button>
      <button data-x="toggle-cat" data-id="${esc(c.id)}">${c.active===false?'Show':'Hide'}</button>
      <button class="del" data-x="del-cat" data-id="${esc(c.id)}">Del</button></div></div>`).join('')
    : `<div class="empty"><h3>No categories</h3></div>`}`;
}

function reviewP () {
  return `<div class="admin-sec"><h2>Reviews</h2>
    <p class="hint">${A.reviews.filter(r=>r.status==='APPROVED').length} approved · ${A.reviews.filter(r=>r.status==='PENDING').length} waiting.</p>
    <button class="btn tiny dark" data-x="new-review">+ Add review</button></div>
  ${A.reviews.length ? A.reviews.map(r=>`<div class="admin-sec">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
      <b style="font-size:13px">${esc(r.name)}</b><span class="status-pill ${esc(r.status)}">${esc(r.status)}</span></div>
    <div class="stars" style="margin-top:6px">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
    <span class="small muted">${esc(fmt(r.created_at))}</span>
    <p class="small" style="margin-top:8px">${esc(r.text)}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="btn tiny outline" data-x="rstat" data-id="${esc(r.id)}" data-s="APPROVED">Approve</button>
      <button class="btn tiny outline" data-x="rstat" data-id="${esc(r.id)}" data-s="PENDING">Pending</button>
      <button class="btn tiny outline" data-x="rstat" data-id="${esc(r.id)}" data-s="REJECTED">Reject</button>
      <button class="btn tiny outline" data-x="edit-review" data-id="${esc(r.id)}">Edit</button>
      <button class="btn tiny danger" data-x="del-review" data-id="${esc(r.id)}">Delete</button></div></div>`).join('')
    : `<div class="empty"><h3>No reviews</h3></div>`}`;
}

function pagesP () {
  return `<div class="admin-sec"><h2>Pages</h2><p class="hint">Custom pages appear in the footer.</p>
    <button class="btn tiny dark" data-x="new-page">+ Add page</button></div>
  ${A.pages.length ? A.pages.map(p=>`<div class="admin-sec">
    <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
      <div><b style="font-size:13px">${esc(p.title)}</b><span class="small muted" style="display:block">/page/${esc(p.slug)}</span></div>
      <span class="status-pill">${p.published?'Live':'Draft'}</span></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
      <button class="btn tiny outline" data-x="edit-page" data-id="${esc(p.id)}">Edit</button>
      <a class="btn tiny outline" target="_blank" href="index.html#/page/${esc(p.slug)}">View</a>
      <button class="btn tiny danger" data-x="del-page" data-id="${esc(p.id)}">Delete</button></div></div>`).join('')
    : `<div class="empty"><h3>No pages</h3></div>`}`;
}

function contentP () {
  const i = (k,l) => `<label class="field"><span>${l}</span><input data-f="${k}" value="${esc(A.content[k]||'')}"></label>`;
  const t = (k,l) => `<label class="field"><span>${l}</span><textarea data-f="${k}" rows="3">${esc(A.content[k]||'')}</textarea></label>`;
  return `<div class="admin-sec"><h2>Hero</h2>${i('heroKicker','Kicker')}${t('heroTitle','Headline')}${t('heroSub','Supporting')}${i('heroVideo','Video URL')}${i('marquee','Marquee')}</div>
  <div class="admin-sec"><h2>Specials</h2>${i('specialsKicker','Kicker')}${i('specialsTitle','Headline')}</div>
  <div class="admin-sec"><h2>Story</h2>${i('storyKicker','Kicker')}${t('storyTitle','Headline')}${t('storyText','Body')}${i('storyImage','Image URL')}
    <label class="field"><span>Bullets (one per line)</span><textarea data-list="storyPoints" rows="3">${esc((A.content.storyPoints||[]).join('\n'))}</textarea></label></div>
  <div class="admin-sec"><h2>Footer</h2>${i('footerNote','Footer line')}</div>
  <button class="btn dark wide" data-x="save-content">Save content</button>`;
}

function shopP () {
  const i = (k,l) => `<label class="field"><span>${l}</span><input data-f="${k}" value="${esc(A.content[k]||'')}"></label>`;
  return `<div class="admin-sec"><h2>Shop details</h2>${i('shopName','Name')}
    <label class="field"><span>Address</span><textarea data-f="address" rows="2">${esc(A.content.address||'')}</textarea></label>
    ${i('mapsQuery','Maps query')}${i('phone','Phone')}${i('email','Email')}${i('instagram','Instagram URL')}</div>
  <div class="admin-sec"><h2>Opening hours</h2>
    ${(A.content.hours||[]).map((h,idx)=>`<div class="hours-row"><label>${DAYS_S[idx]}</label>
      <input type="time" data-h="${idx}" data-k="o" value="${/^([01]\d|2[0-3]):[0-5]\d$/.test(h.o||'') ? h.o : '09:00'}">
      <input type="time" data-h="${idx}" data-k="c" value="${/^([01]\d|2[0-3]):[0-5]\d$/.test(h.c||'') ? h.c : '21:00'}">
      <input type="checkbox" class="closed" data-h="${idx}" data-k="closed" ${h.closed?'checked':''}></div>`).join('')}</div>
  <button class="btn dark wide" data-x="save-shop">Save shop</button>`;
}

function promoP () {
  return `<div class="admin-sec"><h2>Promo code</h2>
    <label class="field"><span>Code</span><input data-s="promoCode" value="${esc(A.settings.promoCode||'')}"></label>
    <label class="field"><span>Percent off</span><input data-s="promoPercent" type="number" value="${Number(A.settings.promoPercent||0)}"></label></div>
  <button class="btn dark wide" data-x="save-settings">Save promo</button>`;
}

function settingsP () {
  return `<div class="admin-sec"><h2>Ordering</h2>
    <label class="field"><span>WhatsApp (digits + country code)</span><input data-s="whatsapp" value="${esc(A.settings.whatsapp||'')}" inputmode="numeric"></label>
    <label class="field"><span>Currency symbol</span><input data-s="currency" value="${esc(A.settings.currency||'₹')}"></label>
    <label class="field"><span>Delivery fee</span><input data-s="deliveryFee" type="number" value="${Number(A.settings.deliveryFee||0)}"></label>
    <label class="field"><span>Free delivery over</span><input data-s="freeDeliveryOver" type="number" value="${Number(A.settings.freeDeliveryOver||0)}"></label>
    <label class="field"><span>Minimum order</span><input data-s="minOrder" type="number" value="${Number(A.settings.minOrder||0)}"></label>
    <label class="field"><span>Delivery estimate</span><input data-s="deliveryEta" value="${esc(A.settings.deliveryEta||'')}"></label>
    <label class="field"><span>Pickup estimate</span><input data-s="pickupEta" value="${esc(A.settings.pickupEta||'')}"></label>
    <label class="field inline"><input type="checkbox" data-s="acceptingOrders" ${A.settings.acceptingOrders?'checked':''}><span>Accepting orders</span></label></div>
  <button class="btn dark wide" data-x="save-settings">Save settings</button>`;
}

/* ---- admin sheets ---- */
const productSheet = p => `<div class="grabber"></div><h2>${A.products.some(x=>x.id===p.id)?'Edit item':'New item'}</h2>
  <label class="field"><span>Name</span><input id="p-name" value="${esc(p.name)}"></label>
  <label class="field"><span>Description</span><textarea id="p-desc" rows="3">${esc(p.description||'')}</textarea></label>
  <label class="field"><span>Category</span><select id="p-cat">${A.categories.map(c=>`<option ${c.name===p.category?'selected':''}>${esc(c.name)}</option>`).join('')}<option>Other</option></select></label>
  <label class="field"><span>Price</span><input id="p-price" type="number" value="${Number(p.price||0)}"></label>
  <label class="field"><span>Sort order</span><input id="p-sort" type="number" value="${Number(p.sort_order||0)}"></label>
  <label class="field"><span>Image URL</span><input id="p-image" value="${esc(p.image||'')}"></label>
  <label class="field inline"><input id="p-veg" type="checkbox" ${p.veg?'checked':''}><span>Vegetarian</span></label>
  <label class="field inline"><input id="p-avail" type="checkbox" ${p.available?'checked':''}><span>Visible on menu</span></label>
  <label class="field inline"><input id="p-feat" type="checkbox" ${p.featured?'checked':''}><span>Show in specials</span></label>
  <div style="display:flex;gap:8px;margin-top:18px"><button class="btn dark" data-x="save-product" data-id="${esc(p.id)}">Save</button><button class="btn outline" data-x="close">Cancel</button></div>`;

const catSheet = c => `<div class="grabber"></div><h2>${c.id?'Edit':'New'} category</h2>
  <label class="field"><span>Name</span><input id="c-name" value="${esc(c.name||'')}" placeholder="e.g. Bowls"></label>
  <label class="field"><span>Category image URL</span><input id="c-image" type="url" inputmode="url" value="${esc(c.image_url||CATEGORY_DEFAULTS[c.name]?.image||'')}" placeholder="https://your-image-host.com/category.jpg"></label>
  <label class="field"><span>Short description</span><textarea id="c-description" rows="2" maxlength="140" placeholder="A short line shown under the image">${esc(c.description||CATEGORY_DEFAULTS[c.name]?.description||'')}</textarea></label>
  <label class="field"><span>Sort order</span><input id="c-sort" type="number" value="${Number(c.sort_order||0)}"></label>
  <label class="field inline"><input id="c-active" type="checkbox" ${c.active!==false?'checked':''}><span>Visible on the website</span></label>
  <div style="display:flex;gap:8px;margin-top:18px"><button class="btn dark" data-x="save-cat" data-id="${esc(c.id||'')}">Save</button><button class="btn outline" data-x="close">Cancel</button></div>`;

const reviewSheet = r => `<div class="grabber"></div><h2>${r.id?'Edit review':'Add review'}</h2>
  <label class="field"><span>Name</span><input id="r-name" value="${esc(r.name||'')}"></label>
  <label class="field"><span>Rating 1-5</span><input id="r-rating" type="number" min="1" max="5" value="${Number(r.rating||5)}"></label>
  <label class="field"><span>Review</span><textarea id="r-text" rows="4">${esc(r.text||'')}</textarea></label>
  <label class="field"><span>Status</span><select id="r-status">${['APPROVED','PENDING','REJECTED'].map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
  <div style="display:flex;gap:8px;margin-top:18px"><button class="btn dark" data-x="save-review" data-id="${esc(r.id||'')}">Save</button><button class="btn outline" data-x="close">Cancel</button></div>`;

const pageSheet = p => `<div class="grabber"></div><h2>${p.id?'Edit page':'New page'}</h2>
  <label class="field"><span>Title</span><input id="g-title" value="${esc(p.title||'')}"></label>
  <label class="field"><span>Slug</span><input id="g-slug" value="${esc(p.slug||'')}" placeholder="about-us"></label>
  <label class="field"><span>Body</span><textarea id="g-body" rows="8">${esc(p.body||'')}</textarea></label>
  <label class="field inline"><input id="g-pub" type="checkbox" ${p.published!==false?'checked':''}><span>Published</span></label>
  <div style="display:flex;gap:8px;margin-top:18px"><button class="btn dark" data-x="save-page" data-id="${esc(p.id||'')}">Save</button><button class="btn outline" data-x="close">Cancel</button></div>`;

function render () { const app = $('#app'); if (app) app.innerHTML = A.authed ? shell() : gate(); }

document.addEventListener('click', async e => {
  touch();
  const el = e.target.closest('[data-x]'); if (!el) return;
  const a = el.dataset.x, id = el.dataset.id;
  const v = k => $(k)?.value ?? '';
  const c = k => !!$(k)?.checked;

  switch (a) {
    case 'close': closeSheet(); return;
    case 'login': { const ok = await signIn(v('#email').trim(), v('#code')); if (ok) render(); return; }
    case 'logout': await signOut(); render(); return;
    case 'tab': A.tab = el.dataset.tab; A.q=''; window.scrollTo(0,0); render(); return;
    case 'filter': A.filter = el.dataset.f; render(); return;
    case 'pull': A.content=await BC.getContent(); A.settings=await BC.getSettings(); A.categories=await BC.getCategories();
      A.products=await BC.getProducts(); A.reviews=await BC.getReviews(); A.orders=await BC.getOrders(); A.pages=await BC.getPages();
      render(); toast('Pulled latest'); return;
    case 'reset': localStorage.clear(); window.location.reload(); return;

    case 'new-product': openSheet(productSheet({ id:BC.uuid(), name:'', description:'', price:0, category:(A.categories[0]?.name||'Other'), image:'', veg:true, available:true, featured:false, sort_order:A.products.length+1 })); return;
    case 'edit-product': { const p = A.products.find(x=>x.id===id); if (p) openSheet(productSheet({...p})); return; }
    case 'save-product': { const p = { id, name:v('#p-name').trim()||'Untitled', description:v('#p-desc').trim(), category:v('#p-cat')||'Other', price:Number(v('#p-price'))||0, sort_order:Number(v('#p-sort'))||0, image:v('#p-image').trim(), veg:c('#p-veg'), available:c('#p-avail'), featured:c('#p-feat') };
      A.products = await BC.saveProduct(p); closeSheet(); render(); toast('Saved'); return; }
    case 'toggle-avail': { const p=A.products.find(x=>x.id===id); if(p){p.available=!p.available; await BC.saveProduct(p); render();} return; }
    case 'toggle-feat': { const p=A.products.find(x=>x.id===id); if(p){p.featured=!p.featured; await BC.saveProduct(p); render();} return; }
    case 'del-product': if (confirm('Delete item?')) { A.products = await BC.deleteProduct(id); render(); toast('Deleted'); } return;

    case 'new-cat': openSheet(catSheet({ id:'', name:'', sort_order:A.categories.length+1, active:true })); return;
    case 'edit-cat': { const x=A.categories.find(y=>y.id===id); if(x) openSheet(catSheet({...x})); return; }
    case 'save-cat': { const name=v('#c-name').trim(); const x={ id:id||BC.uuid(), name, image_url:v('#c-image').trim()||CATEGORY_DEFAULTS[name]?.image||'', description:v('#c-description').trim()||CATEGORY_DEFAULTS[name]?.description||'', sort_order:Number(v('#c-sort'))||0, active:c('#c-active') };
      if(!x.name) return toast('Name required'); A.categories=await BC.saveCategory(x); closeSheet(); render(); toast('Saved'); return; }
    case 'toggle-cat': { const x=A.categories.find(y=>y.id===id); if(x){x.active=x.active===false; await BC.saveCategory(x); render();} return; }
    case 'del-cat': if (confirm('Delete category?')) { A.categories = await BC.deleteCategory(id); render(); } return;

    case 'new-review': openSheet(reviewSheet({ id:'', name:'', rating:5, text:'', status:'APPROVED' })); return;
    case 'edit-review': { const x=A.reviews.find(y=>y.id===id); if(x) openSheet(reviewSheet({...x})); return; }
    case 'save-review': { const x={ id:id||BC.uuid(), name:v('#r-name').trim()||'Guest', rating:Math.min(5,Math.max(1,Number(v('#r-rating'))||5)), text:v('#r-text').trim(), status:v('#r-status'), created_at:(A.reviews.find(y=>y.id===id)?.created_at)||new Date().toISOString() };
      A.reviews=await BC.saveReview(x); closeSheet(); render(); toast('Saved'); return; }
    case 'rstat': { const x=A.reviews.find(y=>y.id===id); if(x){x.status=el.dataset.s; await BC.saveReview(x); render();} return; }
    case 'del-review': if (confirm('Delete review?')) { A.reviews = await BC.deleteReview(id); render(); } return;

    case 'new-page': openSheet(pageSheet({ id:'', title:'', slug:'', body:'', published:true })); return;
    case 'edit-page': { const x=A.pages.find(y=>y.id===id); if(x) openSheet(pageSheet({...x})); return; }
    case 'save-page': { const t=v('#g-title').trim(); const slug=(v('#g-slug').trim()||t).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
      if(!t||!slug) return toast('Title required'); const x={ id:id||BC.uuid(), title:t, slug, body:v('#g-body'), published:c('#g-pub') };
      A.pages=await BC.savePage(x); closeSheet(); render(); toast('Saved'); return; }
    case 'del-page': if (confirm('Delete page?')) { A.pages = await BC.deletePage(id); render(); } return;

    case 'ostat': { const o=A.orders.find(y=>y.id===id); if(o){o.status=el.dataset.s; await BC.saveOrder(o); render();} return; }
    case 'ocopy': { const o=A.orders.find(y=>y.id===id); if(o) navigator.clipboard?.writeText(o.message||''); toast('Copied'); return; }
    case 'odel': if (confirm('Delete order?')) { A.orders = await BC.deleteOrder(id); render(); } return;

    case 'save-content': {
      try {
        const patch = {};
        document.querySelectorAll('[data-f]').forEach(f => { patch[f.dataset.f] = f.value; });
        const l = document.querySelector('[data-list="storyPoints"]');
        if (l) patch.storyPoints = l.value.split('\n').map(s => s.trim()).filter(Boolean);
        A.content = await BC.saveContent(patch);
        render();
        toast('Content saved successfully');
      } catch (err) {
        console.error(err);
        toast('Save failed: ' + (err.message || 'Check Supabase'));
      }
      return;
    }

    case 'save-shop': {
      try {
        const patch = {};

        document.querySelectorAll('[data-f]').forEach(f => {
          patch[f.dataset.f] = f.value;
        });

        const hours = (A.content.hours || []).map(h => ({ ...h }));

        document.querySelectorAll('[data-h]').forEach(el => {
          const i = Number(el.dataset.h);

          if (!hours[i]) return;

          if (el.dataset.k === 'closed') {
            hours[i].closed = el.checked;
          } else {
            hours[i][el.dataset.k] = el.value;
          }
        });

        patch.hours = hours;
        A.content = await BC.saveContent(patch);
        render();
        toast('Shop details saved successfully');
      } catch (err) {
        console.error(err);
        toast('Save failed: ' + (err.message || 'Check Supabase'));
      }
      return;
    }

    case 'save-settings': {
      try {
        const patch = {};

        document.querySelectorAll('[data-s]').forEach(f => {
          patch[f.dataset.s] =
            f.type === 'checkbox'
              ? f.checked
              : f.type === 'number'
                ? Number(f.value)
                : f.value.trim();
        });

        A.settings = await BC.saveSettings(patch);
        render();
        toast('Settings saved successfully');
      } catch (err) {
        console.error(err);
        toast('Save failed: ' + (err.message || 'Check Supabase'));
      }
      return;
    }
  }
});
document.addEventListener('submit', async e => {
  if (e.target.id !== 'admin-login-form') return;
  e.preventDefault();
  BC.init();
  if (!BC.online) {
    toast('Add your Supabase URL and public key in app.js first');
    return;
  }
  const ok = await signIn($('#email')?.value.trim(), $('#code')?.value || '');
  if (ok) render();
});

document.addEventListener('input', e => {
  if (e.target.id==='mq') { A.q=e.target.value; const p=e.target.selectionStart; render(); const el=$('#mq'); if(el){el.focus(); el.setSelectionRange(p,p);} }
});
document.addEventListener('keydown', e => {
  touch();
  if (e.key==='Escape') closeSheet();
  if (e.key==='Enter' && !A.authed) $('[data-x="login"]')?.click();
});

(async function boot () {
  BC.init();
  if (BC.online) {
    try {
      const { data } = await BC.client.auth.getSession();
      const user = data?.session?.user;
      if (user && await hasAdminAccess(user)) { A.authUser=user; A.authed=true; }
      else if (user) await BC.client.auth.signOut();
    } catch (error) { console.error('Session restore failed:', error); }
  }
  A.content=await BC.getContent(); A.settings=await BC.getSettings(); A.categories=await BC.getCategories();
  A.products=await BC.getProducts(); A.reviews=await BC.getReviews(); A.orders=await BC.getOrders(); A.pages=await BC.getPages();
  render();
})();

} else {
/* =========================================================
   SITE APP
   ========================================================= */
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const S = { content:{}, settings:{}, products:[], categories:[], reviews:[], pages:[],
  cart:[], favs:[], q:'', cat:'All', veg:false, rating:5,
  bag:{ name:'', phone:'', address:'', notes:'', type:'delivery' }, bagStep:1,
  promo:'', lastOrder:null, sending:false, route:{ page:'home', arg:null } };
const money = n => (S.settings.currency||'₹') + Number(n||0).toLocaleString('en-IN');
const to12 = t => { const [h,m]=String(t||'00:00').split(':').map(Number); return (h%12||12)+':'+String(m).padStart(2,'0')+' '+(h>=12?'PM':'AM'); };
const fmtDate = iso => new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
const accepting = () => S.settings.acceptingOrders !== false;

const IC = {
  phone:'<path d="M6.2 3h3l1.9 4.7-2 1.2a12 12 0 0 0 5.9 5.9l1.2-2L21 14.7v3a2.3 2.3 0 0 1-2.4 2.3A16.6 16.6 0 0 1 3.7 5.4 2.3 2.3 0 0 1 6 3Z"/>',
  wa:'<path d="M12 3a9 9 0 0 0-7.7 13.7L3 21l4.4-1.2A9 9 0 1 0 12 3Z"/><path d="M9 9.4c0 3 2.6 5.6 5.6 5.6"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2.4"/><path d="m4 7.4 8 5.6 8-5.6"/>',
  ig:'<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.3"/><circle cx="16.6" cy="7.4" r="1"/>',
  pin:'<path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10Z"/><circle cx="12" cy="11" r="2.2"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${IC[n]}</svg>`;
const NAVI = {
  home:'<path d="M3 10.6 12 3.4l9 7.2"/><path d="M5.6 9.4V20.6h12.8V9.4"/>',
  menu:'<rect x="3.2" y="4.4" width="17.6" height="4.2" rx="1.4"/><rect x="3.2" y="11" width="17.6" height="4.2" rx="1.4"/><rect x="3.2" y="17.6" width="17.6" height="3.4" rx="1.4"/>',
  bag:'<path d="M6.2 8h11.6l1 12H5.2z"/><path d="M9.2 8V6.2a2.8 2.8 0 0 1 5.6 0V8"/>',
  star:'<path d="m12 3.4 2.6 5.4 5.9.9-4.3 4.2 1 5.9L12 17l-5.2 2.8 1-5.9-4.3-4.2 5.9-.9z"/>',
  grid:'<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>'
};
const HEART = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7 3c0 5-7 9.4-7 9.4Z"/></svg>';

function openStatus () {
  const hours = S.content.hours || [];
  const now = new Date(); const today = hours[now.getDay()];
  if (!today || today.closed) return { open:false, text:'Closed today' };
  const mins = now.getHours()*60+now.getMinutes();
  const [oh,om] = String(today.o||'00:00').split(':').map(Number);
  const [ch,cm] = String(today.c||'23:59').split(':').map(Number);
  if (mins>=oh*60+om && mins<ch*60+cm) return { open:true, text:'Open · closes '+to12(today.c) };
  if (mins<oh*60+om) return { open:false, text:'Opens '+to12(today.o) };
  const tm = hours[(now.getDay()+1)%7];
  return { open:false, text: tm&&!tm.closed ? 'Opens tomorrow '+to12(tm.o) : 'Closed' };
}

function parse () {
  const h = window.location.hash.replace(/^#\/?/,'');
  const p = h.split('/');
  return { page: p[0] || 'home', arg: p[1] ? decodeURIComponent(p[1]) : null };
}

const onMenuDoc = () => window.location.pathname.endsWith('/menu.html');

function go (page, arg) {
  sheet.on = false;
  const hash = '#/' + page + (arg ? '/' + encodeURIComponent(arg) : '');
  const wantMenuDoc = page === 'menu';
  if (onMenuDoc() !== wantMenuDoc) {
    window.location.href = (wantMenuDoc ? 'menu.html' : 'index.html') + hash;
    return;
  }
  if (window.location.hash === hash) { window.scrollTo(0,0); render(); return; }
  window.location.hash = hash;
  window.scrollTo(0,0);
}

let taps=0, tapTimer;
function tapBrand () {
  taps++;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(()=>taps=0,1400);
  if (taps>=4) {
    taps=0; clearTimeout(tapTimer);
    window.location.href='admin.html';
    return true;
  }
  return false;
}

const sheet = { on:false, id:null, qty:1, note:'' };

function nav () {
  const r = S.route.page; const n = S.cart.reduce((s,l)=>s+l.qty,0);
  const b = (p,l,i) => `<button type="button" class="${r===p?'active':''}" data-x="go" data-page="${p}" aria-label="${l}" ${r===p?'aria-current="page"':''}>${i}<span>${l}</span>${p==='bag'&&n?`<i class="badge">${n}</i>`:''}</button>`;
  return `<nav class="nav" aria-label="Main navigation">
    ${b('home','Home',`<svg viewBox="0 0 24 24">${NAVI.home}</svg>`)}
    ${b('menu','Menu',`<svg viewBox="0 0 24 24">${NAVI.menu}</svg>`)}
    ${b('bag','Cart',`<svg viewBox="0 0 24 24">${NAVI.bag}</svg>`)}
    ${b('reviews','Reviews',`<svg viewBox="0 0 24 24">${NAVI.star}</svg>`)}
  </nav>`;
}

/* ---------- CARDS ---------- */
function rowItem (p) {
  const fav = S.favs.includes(p.id);
  return `<article class="row">
    <div class="row-media" data-x="open" data-id="${esc(p.id)}">
      <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">${p.veg?'<span class="dot-veg"></span>':''}
    </div>
    <div class="row-body">
      <span class="kicker">${esc(p.category)}</span>
      <h3 data-x="open" data-id="${esc(p.id)}">${esc(p.name)}</h3>
      <p>${esc(p.description)}</p>
      <div class="row-foot"><strong>${money(p.price)}</strong>
        <div class="row-acts">
          <button class="heart ${fav?'on':''}" data-x="fav" data-id="${esc(p.id)}" aria-label="Save ${esc(p.name)}">${HEART}</button>
          <button class="add" data-x="add" data-id="${esc(p.id)}" aria-label="Add ${esc(p.name)}">+</button></div></div>
    </div></article>`;
}
const productCard = p => rowItem(p);

/* horizontal rail card for the home specials */
function railCard (p) {
  return `<article class="rail-card" data-x="open" data-id="${esc(p.id)}">
    ${p.featured?'<span class="tag">Special</span>':''}
    <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
    <div class="rc-body">
      <span class="kicker">${esc(p.category)}</span>
      <h3>${esc(p.name)}</h3>
      <div class="rc-foot"><strong>${money(p.price)}</strong>
        <button class="add" data-x="add" data-id="${esc(p.id)}" aria-label="Add ${esc(p.name)}">+</button></div>
    </div></article>`;
}

function foot () {
  const tel = digits(S.content.phone);
  return `<footer class="foot">
    <div class="foot-columns">
      <div class="foot-brand-side">
        <div class="fbrand">Broccoli<span>Club</span></div>
        <p>${esc(S.content.footerNote||'Good food. Better mood.')}</p>
        <nav class="foot-explore" aria-label="Explore Broccoli Club">
          <a href="index.html#/home">Home</a><a href="menu.html">Explore menu</a><a href="index.html#/reviews">Reviews</a>
          ${S.pages.filter(p=>p.published).map(p=>`<a href="index.html#/page/${esc(p.slug)}">${esc(p.title)}</a>`).join('')}
        </nav>
      </div>
      <div class="foot-contact-side">
        <h4>Contact</h4>
        <div class="flinks">
          <a href="tel:${tel}">${ic('phone')} ${esc(S.content.phone)}</a>
          <a href="mailto:${esc(S.content.email)}">${ic('mail')} ${esc(S.content.email)}</a>
          <a href="https://wa.me/${digits(S.settings.whatsapp)}" target="_blank" rel="noreferrer">${ic('wa')} WhatsApp</a>
          ${S.content.instagram?`<a href="${esc(S.content.instagram)}" target="_blank" rel="noreferrer">${ic('ig')} Instagram</a>`:''}
        </div>
      </div>
    </div>
    <div class="fbot"><span>© ${new Date().getFullYear()} Broccoli Club</span><span>Delivery ${esc(S.settings.deliveryEta)}</span></div>
  </footer>`;
}

/* ---------- CATEGORY CAROUSEL ---------- */
function categoryCarousel () {
  const cats = S.categories.filter(c=>c.active!==false).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));
  if (!cats.length) return '';
  return `<section class="section category-section" aria-labelledby="browse-categories-title">
    <div class="sec-head"><div><span class="kicker">FIND YOUR FAVOURITE</span><h2 id="browse-categories-title">Browse by category</h2></div>
      <a class="link" href="menu.html">View menu</a></div>
    <div class="category-carousel-shell">
      <div class="splide category-splide" id="category-splide" aria-label="Browse food categories">
        <div class="splide__track"><ul class="splide__list">
          ${cats.map((c,i)=>`<li class="splide__slide">
            <a href="menu.html?category=${encodeURIComponent(c.name)}#/menu" class="splide__img" aria-label="Browse ${esc(c.name)}" style="background-image:url('${esc(categoryImage(c)).replace(/'/g,'%27')}')">
              <span class="slide-caption">${esc(c.name)}</span>
              <span class="slide-description">${esc(categoryDescription(c))}</span>
              <span class="slide-arrow" aria-hidden="true">↗</span>
            </a>
          </li>`).join('')}
        </ul></div>
      </div>
      <div class="carousel__controls" aria-label="Category carousel controls">
        <button class="carousel-control prev-category" type="button" aria-label="Previous category">←</button>
        <button class="carousel-control next-category" type="button" aria-label="Next category">→</button>
      </div>
    </div>
  </section>`;
}

/* ---------- HOME ---------- */
function home () {
  const st = openStatus();
  const specials = S.products.filter(p=>p.available!==false && p.featured).slice(0,8);
  return `<section class="hero">
    <video class="hero-video" src="${esc(S.content.heroVideo)}" autoplay muted loop playsinline preload="metadata"></video>
    <div class="hero-scrim"></div>
    <div class="hero-inner">
      <div class="hero-top">
        <button class="mark" data-x="brand">BC</button>
        <span class="chip ${st.open?'':'off'}"><i></i>${esc(st.text)}</span>
      </div>
      <div class="hero-copy">
        <span class="kicker light">${esc(S.content.heroKicker)}</span>
        <h1>${String(S.content.heroTitle||'').split('\n').map(l=>`<span>${esc(l)}</span>`).join('')}</h1>
        <p>${esc(S.content.heroSub)}</p>
        <div class="hero-btns"><a class="btn solid" href="menu.html">Order now</a><a class="btn ghost" href="#/location">Find us</a></div>
      </div>
      <div class="hero-foot"><span>Delivery ${esc(S.settings.deliveryEta)}</span><span>Free over ${money(S.settings.freeDeliveryOver)}</span></div>
    </div>
  </section>
  <div class="marquee"><span>${esc(S.content.marquee)}${esc(S.content.marquee)}</span></div>

  ${specials.length?`<section class="section">
    <div class="sec-head"><div><span class="kicker">${esc(S.content.specialsKicker)}</span><h2>${esc(S.content.specialsTitle)}</h2></div>
      <a class="link" href="menu.html">Full menu</a></div>
    <div class="rail">${specials.map(railCard).join('')}</div>
  </section>`:''}

  ${categoryCarousel()}

  <section class="story section">
    <div class="story-media"><img class="story-img" src="${esc(S.content.storyImage)}" alt="Freshly prepared food" loading="lazy"></div>
    <div class="story-copy"><span class="kicker">${esc(S.content.storyKicker)}</span>
      <h2>${String(S.content.storyTitle||'').split('\n').map(l=>`<span>${esc(l)}</span>`).join('')}</h2>
      <p>${esc(S.content.storyText)}</p>
      <ul class="points">${(S.content.storyPoints||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
      <a class="btn dark" href="menu.html">Explore the menu</a>
    </div>
  </section>
  <section class="section location-teaser">
    <div><span class="kicker">COME SAY HELLO</span><h2>Made fresh.<br>Made for you.</h2><p>${esc(S.content.address)}</p></div>
    <a class="btn outline" href="#/location">Find us ${ic('pin')}</a>
  </section>
  ${foot()}`;
}

/* ---------- MENU ---------- */
function menuPage () {
  const cats = ['All'].concat(S.categories.filter(c=>c.active!==false).map(c=>c.name));
  const q = S.q.trim().toLowerCase();
  const list = S.products
    .filter(p => p.available !== false)
    .filter(p => S.cat === 'All' || p.category === S.cat)
    .filter(p => !S.veg || p.veg)
    .filter(p => !q || (p.name+' '+p.category+' '+(p.description||'')).toLowerCase().includes(q))
    .sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));

  return `<div class="page-head"><button class="mark" data-x="brand">BC</button>
    <span class="kicker light">Cooked to order</span>
    <h1>The menu.</h1>
    <p>${list.length} item${list.length===1?'':'s'} available.</p></div>
  <section class="section tight">
    <div class="filters">
      <input id="q" class="search" value="${esc(S.q)}" placeholder="Search the menu" aria-label="Search menu" autocomplete="off" enterkeyhint="search">
      <button class="btn tiny ${S.veg?'dark':'outline'}" data-x="veg" aria-pressed="${S.veg}">Veg only</button>
    </div>
    <div class="menu-category-carousel" aria-label="Browse menu categories">
      ${S.categories.filter(c=>c.active!==false).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(c=>`<button type="button" class="menu-category-card ${S.cat===c.name?'active':''}" data-x="cat" data-cat="${esc(c.name)}">
        <span class="menu-category-image"><img src="${esc(categoryImage(c))}" alt="" loading="lazy" onerror="this.closest('.menu-category-image').classList.add('image-missing');this.remove()"></span>
        <span class="menu-category-name">${esc(c.name)}</span></button>`).join('')}
    </div>
    <div class="chips">${cats.map(c=>`<button class="chip-btn ${S.cat===c?'active':''}" data-x="cat" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  </section>
  <section class="section tight menu-catalog">
    <nav class="menu-side-cats" aria-label="Menu categories">
      <button type="button" class="menu-side-cat ${S.cat==='All'?'active':''}" data-x="cat" data-cat="All"><span class="side-cat-all">✦</span><span>All</span></button>
      ${S.categories.filter(c=>c.active!==false).slice().sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(c=>`<button type="button" class="menu-side-cat ${S.cat===c.name?'active':''}" data-x="cat" data-cat="${esc(c.name)}">
        <span class="side-cat-image"><img src="${esc(categoryImage(c))}" alt="" loading="lazy" onerror="this.closest('.side-cat-image').classList.add('image-missing');this.remove()"></span><span>${esc(c.name)}</span></button>`).join('')}
    </nav>
    <div class="menu-results">
      ${list.length ? `<div class="rows">${list.map(rowItem).join('')}</div>`
        : `<div class="empty"><h3>Nothing matches</h3><p>Try another search or category.</p></div>`}
    </div>
  </section>${foot()}`;
}

/* ---------- CART / CHECKOUT ---------- */
function totals () {
  const lines = S.cart
    .map(l => { const product = S.products.find(p => p.id === l.id) || l.product; return product ? { ...l, product } : null; })
    .filter(Boolean);

  const subtotal = lines.reduce((s,l) => s + Number(l.product.price||0) * l.qty, 0);
  const code = String(S.promo||'').trim().toUpperCase();
  const valid = code && code === String(S.settings.promoCode||'').trim().toUpperCase();
  const discount = valid ? Math.round(subtotal * (Number(S.settings.promoPercent)||0) / 100) : 0;
  const afterDiscount = Math.max(0, subtotal - discount);
  const freeOver = Number(S.settings.freeDeliveryOver||0);
  const deliveryFee = (S.bag.type === 'delivery' && subtotal > 0 && afterDiscount < freeOver)
    ? Number(S.settings.deliveryFee||0) : 0;

  return { lines, subtotal, discount, deliveryFee, total: afterDiscount + deliveryFee };
}

function cartLine (l) {
  const note = esc(l.note||'');
  return `<div class="cart-line">
    <img src="${esc(l.product.image)}" alt="" loading="lazy">
    <div class="cl-body">
      <b>${esc(l.product.name)}</b>
      ${l.note?`<span class="small muted">${esc(l.note)}</span>`:''}
      <span class="small muted">${money(l.product.price)} each</span>
      <button class="rm" data-x="rm" data-id="${esc(l.id)}" data-note="${note}">Remove</button>
    </div>
    <div class="cl-acts">
      <div class="qty">
        <button data-x="dec" data-id="${esc(l.id)}" data-note="${note}" aria-label="Decrease">−</button>
        <b>${l.qty}</b>
        <button data-x="inc" data-id="${esc(l.id)}" data-note="${note}" aria-label="Increase">+</button>
      </div>
      <strong>${money(l.product.price * l.qty)}</strong>
    </div></div>`;
}

function cartPage () {
  const t = totals();
  const min = Number(S.settings.minOrder||0);
  const freeOver = Number(S.settings.freeDeliveryOver||0);
  const short = Math.max(0, min - t.subtotal);
  const toFree = Math.max(0, freeOver - (t.subtotal - t.discount));
  const isDelivery = S.bag.type === 'delivery';
  const blocked = !accepting();
  const count = t.lines.reduce((s,l)=>s+l.qty,0);
  const step = Math.min(3,Math.max(1,Number(S.bagStep)||1));
  const stepHead = `<div class="checkout-steps" aria-label="Checkout progress">
    ${[['1','Your items'],['2','Your details'],['3','Review order']].map(([n,label])=>`<div class="checkout-step ${step===Number(n)?'active':step>Number(n)?'complete':''}"><span>${step>Number(n)?'✓':n}</span><b>${label}</b></div>`).join('')}
  </div>`;
  const itemList = t.lines.length ? `<div class="cart-items">${t.lines.map(cartLine).join('')}</div>`
    : `<div class="empty"><h3>Your bag is empty</h3><p>Choose something fresh from the menu to get started.</p><a class="btn dark" href="menu.html" style="margin-top:14px">Browse menu</a></div>`;
  const typePicker = `<div class="card order-type-card">
    <span class="kicker">How would you like it?</span>
    <div class="toggle-row">
      <button type="button" class="${isDelivery?'active':''}" data-x="otype" data-type="delivery" aria-pressed="${isDelivery}">Delivery</button>
      <button type="button" class="${!isDelivery?'active':''}" data-x="otype" data-type="pickup" aria-pressed="${!isDelivery}">Pickup</button>
    </div>
    ${isDelivery && toFree>0 ? `<p class="small muted" style="margin-top:10px">${money(toFree)} away from free delivery.</p>` : ''}
    ${isDelivery && toFree===0 && count ? `<p class="small muted" style="margin-top:10px">Free delivery unlocked.</p>` : ''}
  </div>`;
  const detailFields = `<div class="card checkout-fields">
    <span class="kicker">Your details</span>
    <label class="field"><span>Name</span><input id="f-name" maxlength="60" value="${esc(S.bag.name)}" placeholder="Your name" autocomplete="name"></label>
    <label class="field"><span>Phone</span><input id="f-phone" inputmode="tel" maxlength="18" value="${esc(S.bag.phone)}" placeholder="Phone number" autocomplete="tel"></label>
    ${isDelivery?`<label class="field"><span>Delivery address</span><textarea id="f-addr" rows="2" placeholder="Flat, street, landmark" autocomplete="street-address">${esc(S.bag.address)}</textarea></label><button class="btn tiny outline" data-x="locate" type="button">Use my location</button>`:''}
    <label class="field"><span>Notes for the kitchen</span><input id="f-notes" maxlength="160" value="${esc(S.bag.notes)}" placeholder="Less spicy, no onion"></label>
  </div>
  <div class="card promo-card"><span class="kicker">Coupon code</span><div class="promo-row">
    <input id="f-promo" value="${esc(S.promo)}" placeholder="CLUB10" aria-label="Coupon code" autocomplete="off">
    <button class="btn tiny dark" data-x="promo" type="button">Apply</button></div>
    ${S.promo && !t.discount ? '<p class="small muted" style="margin-top:8px">That code is not valid. Check it and try again.</p>' : (t.discount?'<p class="small promo-success" style="margin-top:8px">Coupon applied.</p>':'')}
  </div>`;
  const totalsCard = `<div class="card order-summary">
    <span class="kicker">Order summary</span>
    ${t.lines.map(l=>`<div class="summary-line"><span>${esc(l.product.name)} × ${l.qty}</span><b>${money(l.product.price*l.qty)}</b></div>`).join('')}
    <div class="kv"><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    ${t.discount?`<div class="kv save"><span>Discount (${esc(String(S.promo).toUpperCase())})</span><span>-${money(t.discount)}</span></div>`:''}
    ${isDelivery?`<div class="kv"><span>Delivery</span><span>${t.deliveryFee?money(t.deliveryFee):'Free'}</span></div>`:''}
    <div class="kv total"><span>Total</span><span>${money(t.total)}</span></div>
    ${short>0?`<p class="small muted" style="margin-top:8px">Add ${money(short)} to reach the ${money(min)} minimum.</p>`:''}
    ${blocked?'<p class="small muted">The kitchen is paused right now.</p>':''}
  </div>`;
  let content = '';
  if (step===1) content = `${itemList}${t.lines.length?`${typePicker}<div class="checkout-actions"><button class="btn dark wide" data-x="checkout-step" data-step="2">Continue to details</button></div>`:''}`;
  if (step===2) content = `${typePicker}${detailFields}<div class="checkout-actions checkout-actions-split"><button class="btn outline" data-x="checkout-step" data-step="1">Back to items</button><button class="btn dark" data-x="checkout-step" data-step="3">Review order</button></div>`;
  if (step===3) content = `${totalsCard}<div class="card customer-summary"><span class="kicker">Delivering ${isDelivery?'to':'as pickup for'}</span><b>${esc(S.bag.name||'Your name')}</b><p>${esc(S.bag.phone||'Phone not added')}</p>${isDelivery?`<p>${esc(S.bag.address||'Address not added')}</p>`:''}<button class="btn tiny outline" data-x="checkout-step" data-step="2">Edit details</button></div><div class="checkout-actions checkout-actions-split"><button class="btn outline" data-x="checkout-step" data-step="2">Back</button><button class="btn dark" data-x="send" ${blocked?'disabled':''}>Send on WhatsApp</button></div><p class="small muted checkout-note">WhatsApp opens with your order ready to send. Nothing is sent until you confirm it there.</p>`;
  return `<div class="page-head"><button class="mark" data-x="brand">BC</button>
    <span class="kicker light">Your bag</span><h1>${count?`${count} item${count===1?'':'s'}`:'Your order.'}</h1>
    <p>${blocked ? 'Kitchen is paused right now.' : (isDelivery ? 'Delivery in '+esc(S.settings.deliveryEta) : 'Pickup in '+esc(S.settings.pickupEta))}</p></div>
    <section class="section tight cart-checkout"><div class="cart-layout">
      <div class="cart-main">${stepHead}<div class="checkout-step-content">${content}</div></div>
      ${step===1 && t.lines.length?`<aside class="cart-aside">${totalsCard}<p class="small muted">You can change quantities before checkout.</p></aside>`:''}
    </div></section>${foot()}`;
}

/* ---------- REVIEWS ---------- */
function reviews () {
  const ok = S.reviews.filter(r=>r.status==='APPROVED');
  const avg = ok.length ? (ok.reduce((s,r)=>s+r.rating,0)/ok.length).toFixed(1) : null;
  return `<div class="page-head"><button class="mark" data-x="brand">BC</button>
    <span class="kicker light">Word of mouth</span>
    <h1>${avg?`${esc(avg)} out of 5`:'Be the<br>first one.'}</h1>
    <p>${ok.length} published review${ok.length===1?'':'s'}.</p></div>
  <section class="section">
    ${ok.length?ok.map(r=>`<div class="review">
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <p>${esc(r.text)}</p><span class="who">${esc(r.name)}</span><span class="when">${esc(fmtDate(r.created_at||Date.now()))}</span>
    </div>`).join(''):`<div class="empty"><h3>No reviews yet</h3><p>Yours could be the first.</p></div>`}
    <div class="card" style="margin-top:18px">
      <span class="kicker">Your turn</span>
      <label class="field"><span>Name</span><input id="rv-name" maxlength="60" placeholder="How should we credit you?" autocomplete="name"></label>
      <div class="field"><span>Rating</span>
        <div class="rating-picker">${[1,2,3,4,5].map(n=>`<button data-x="rate" data-n="${n}" class="${n<=S.rating?'on':''}" aria-label="${n} star${n===1?'':'s'}">★</button>`).join('')}</div></div>
      <label class="field"><span>Review</span><textarea id="rv-text" rows="4" maxlength="900" placeholder="What did you order, and how was it?"></textarea></label>
      <button class="btn dark wide" style="margin-top:16px" data-x="submit-review">Submit review</button>
    </div>
  </section>${foot()}`;
}

/* ---------- LOCATION ---------- */
function locationPage () {
  const st = openStatus();
  return `<div class="page-head"><button class="mark" data-x="brand">BC</button>
    <span class="kicker light">One kitchen, one club</span>
    <h1>Find your<br>way to us.</h1><p>${esc(st.text)}</p></div>
  <section class="section tight">
    <iframe class="mapframe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Map"
      src="https://www.google.com/maps?q=${encodeURIComponent(S.content.mapsQuery||S.content.address)}&output=embed"></iframe>
  </section>
  <section class="section">
    <div class="card"><span class="kicker">Address</span><h3 style="margin:8px 0">${esc(S.content.shopName)}</h3>
      <p class="small">${esc(S.content.address)}</p>
      <a class="btn dark tiny" style="margin-top:14px" target="_blank" rel="noreferrer"
        href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.content.mapsQuery||S.content.address)}">${ic('pin')} Directions</a></div>
    <div class="card" style="margin-top:12px"><span class="kicker">Hours</span>
      ${(S.content.hours||[]).map((h,i)=>`<div class="kv ${i===new Date().getDay()?'today':''}">
        <span>${DAYS[i]}</span><span>${h.closed?'Closed':to12(h.o)+' - '+to12(h.c)}</span></div>`).join('')}</div>
    <div class="card dark" style="margin-top:12px"><span class="kicker light">Contact</span>
      <p class="small" style="color:rgba(247,243,232,.8);margin-top:8px">${esc(S.content.phone)}<br>${esc(S.content.email)}</p>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <a class="btn tiny solid" href="tel:${digits(S.content.phone)}">${ic('phone')} Call</a>
        <a class="btn tiny ghost" target="_blank" rel="noreferrer" href="https://wa.me/${digits(S.settings.whatsapp)}">${ic('wa')} WhatsApp</a></div></div>
  </section>${foot()}`;
}

/* ---------- SENT ---------- */
function sent () {
  const o = S.lastOrder; if (!o) return home();
  return `<div class="sent-hero">
    <span class="kicker light">Order prepared</span>
    <h1>Sent to<br>WhatsApp.</h1>
    <p class="small" style="color:rgba(247,243,232,.75)">Finish the send in WhatsApp.</p>
    <div class="receipt"><pre>${esc(o.message)}</pre></div>
    <div class="acts">
      <a class="btn solid" href="${esc(o.link)}" target="_blank" rel="noreferrer">Open WhatsApp again</a>
      <button class="btn ghost" data-x="copy">Copy order text</button>
      <a class="btn ghost" href="menu.html">Back to menu</a></div>
  </div>`;
}

/* ---------- CUSTOM PAGE ---------- */
function pageView (slug) {
  const p = S.pages.find(x=>x.slug===slug && x.published);
  if (!p) return `<div class="page-head"><button class="mark" data-x="brand">BC</button><h1>Not found</h1>
    <p>The page you asked for is not here.</p></div>${foot()}`;
  return `<div class="page-head"><button class="mark" data-x="brand">BC</button><span class="kicker light">Page</span><h1>${esc(p.title)}</h1></div>
    <section class="section"><div class="small" style="white-space:pre-wrap;font-size:13.5px">${esc(p.body)}</div></section>${foot()}`;
}

/* ---------- ROUTER ---------- */
function render () {
  S.route = parse();
  let html;
  switch (S.route.page) {
    case 'menu':     html = menuPage(); break;
    case 'bag':      html = cartPage(); break;
    case 'reviews':  html = reviews(); break;
    case 'location': html = locationPage(); break;
    case 'sent':     html = sent(); break;
    case 'page':     html = pageView(S.route.arg); break;
    default:         html = home();
  }
  const app = $('#app'); if (!app) return;
  app.innerHTML = nav() + html;
  document.body.dataset.route = S.route.page;
  renderSheet();
  setupCategoryCarousel();
}

let categorySplideInstance = null;
function setupCategoryCarousel () {
  const root = document.getElementById('category-splide');
  if (categorySplideInstance) { try { categorySplideInstance.destroy(true); } catch {} categorySplideInstance=null; }
  if (!root || !window.Splide) return;
  const previous = document.querySelector('.prev-category');
  const next = document.querySelector('.next-category');
  try {
    categorySplideInstance = new Splide(root, {
      type:'loop', perPage:3, perMove:1, focus:'center', gap:'clamp(12px,2vw,24px)',
      speed:420, easing:'cubic-bezier(.22,.75,.25,1)', drag:true, arrows:false, pagination:false,
      waitForTransition:false, flickPower:420, flickMaxPages:1, autoplay:true, interval:3200, pauseOnHover:true, pauseOnFocus:true, resetProgress:false,
      breakpoints:{1100:{perPage:2},767:{perPage:1,gap:'14px',padding:{left:'9%',right:'9%'}},520:{perPage:1,gap:'12px',padding:{left:'7%',right:'7%'}}}
    });
    categorySplideInstance.mount();
    if (previous) previous.onclick=()=>categorySplideInstance?.go('<');
    if (next) next.onclick=()=>categorySplideInstance?.go('>');
  } catch(error) { console.warn('Category carousel fallback enabled:',error); }
}

function renderSheet () {
  const el = $('#sheet'); if (!el) return;
  if (!sheet.on || !sheet.id) { el.classList.remove('open'); el.innerHTML=''; document.body.classList.remove('locked'); return; }
  const p = S.products.find(x=>x.id===sheet.id);
  if (!p) { sheet.on=false; return renderSheet(); }
  el.innerHTML = `<div class="sheet-backdrop" data-x="close-sheet"></div><div class="sheet">
    <div class="grabber"></div><img class="sheet-img" src="${esc(p.image)}" alt="">
    <span class="kicker" style="display:block;margin-top:16px">${esc(p.category)}${p.veg?' · Veg':''}</span>
    <h2>${esc(p.name)}</h2><p class="desc">${esc(p.description)}</p>
    <label class="field"><span>Note for the kitchen</span><input id="s-note" value="${esc(sheet.note)}" placeholder="Less spicy, no onion"></label>
    <div class="sheet-foot"><div class="qty-big"><button data-x="sdec" aria-label="Less">−</button><b>${sheet.qty}</b><button data-x="sinc" aria-label="More">+</button></div>
      <button class="btn solid" style="flex:1" data-x="sadd">Add ${money(p.price*sheet.qty)}</button></div></div>`;
  el.classList.add('open'); document.body.classList.add('locked');
}

/* ---------- CART HELPERS ---------- */
function addToCart (id, qty=1, note='') {
  const p = S.products.find(x=>x.id===id); if (!p) return;
  const l = S.cart.find(x=>x.id===id && (x.note||'')===note);
  if (l) l.qty += qty; else S.cart.push({ id, qty, note, product: { id:p.id, name:p.name, price:Number(p.price||0), image:p.image||'', category:p.category||'', description:p.description||'' } });
  BC.setCart(S.cart); toast(p.name+' added');
}
function orderId () { const d=new Date(); return 'BC-'+String(d.getFullYear()).slice(2)+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+String(Math.floor(Math.random()*900)+100); }
function buildMessage (o) {
  const L=['*BROCCOLI CLUB*','New order','','Order ID: '+o.id,'Type: '+(o.type==='delivery'?'Delivery':'Pickup'),'Placed: '+fmtDate(o.created_at),'','*ITEMS*'];
  o.items.forEach((l,i)=>{ L.push((i+1)+'. '+l.name+' x '+l.qty+' - '+money(l.price*l.qty)); if(l.note) L.push('    Note: '+l.note); });
  L.push('','Subtotal: '+money(o.subtotal));
  if (o.discount) L.push('Discount ('+o.promo+'): -'+money(o.discount));
  if (o.delivery_fee) L.push('Delivery: '+money(o.delivery_fee));
  L.push('*Total: '+money(o.total)+'*','','*CUSTOMER*','Name: '+o.customer.name,'Phone: '+o.customer.phone);
  if (o.type==='delivery'&&o.customer.address) L.push('Address: '+o.customer.address);
  if (o.customer.notes) L.push('Notes: '+o.customer.notes);
  L.push('','Please confirm.'); return L.join('\n');
}
function currentOrder () {
  const t = totals(); if (!t.lines.length) return null;
  const o = { id:orderId(), created_at:new Date().toISOString(), type:S.bag.type,
    customer:{ name:S.bag.name.trim(), phone:S.bag.phone.trim(), address:S.bag.address.trim(), notes:S.bag.notes.trim() },
    subtotal:t.subtotal, discount:t.discount, promo:S.promo.trim().toUpperCase(), delivery_fee:t.deliveryFee,
    total:t.total, status:'NEW', items:t.lines.map(l=>({ name:l.product.name, qty:l.qty, price:l.product.price, note:l.note })) };
  o.message = buildMessage(o);
  o.link = 'https://wa.me/'+digits(S.settings.whatsapp)+'?text='+encodeURIComponent(o.message);
  return o;
}
function sendOrder () {
  if (S.sending) return;
  const t = totals();
  if (!t.lines.length) return toast('Bag is empty');
  if (!accepting()) return toast('Kitchen is paused');
  if (t.subtotal < Number(S.settings.minOrder||0)) return toast('Minimum '+money(S.settings.minOrder));
  if (!S.bag.name.trim()) return toast('Add your name');
  if (digits(S.bag.phone).length < 8) return toast('Add a valid phone');
  if (S.bag.type==='delivery' && !S.bag.address.trim()) return toast('Add an address');

  S.sending = true;
  const o = currentOrder();
  BC.createOrder(o);
  BC.setLastOrder(o);
  S.lastOrder = o;
  S.cart = []; BC.setCart(S.cart); S.promo='';

  const win = window.open(o.link,'_blank','noopener');
  if (!win) toast('Allow pop-ups to open WhatsApp');
  S.sending = false;
  go('sent');
}
function copyText (t) { if (!t) return toast('Nothing to copy'); navigator.clipboard?.writeText(t).then(()=>toast('Copied'),()=>toast('Copy failed')); }

/* ---------- EVENTS ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-x]'); if (!el) return;
  const a = el.dataset.x, id = el.dataset.id;
  if (a==='brand') { if (!tapBrand()) go('home'); return; }
  if (a==='go' && el.dataset.page==='home' && tapBrand()) return;
  switch (a) {
    case 'go': e.preventDefault(); go(el.dataset.page); return;
    case 'open': sheet.on=true; sheet.id=id; sheet.qty=1; sheet.note=''; renderSheet(); return;
    case 'close-sheet': sheet.on=false; renderSheet(); return;
    case 'sinc': sheet.qty++; renderSheet(); return;
    case 'sdec': sheet.qty=Math.max(1,sheet.qty-1); renderSheet(); return;
    case 'sadd': addToCart(sheet.id, sheet.qty, ($('#s-note')?.value||'').trim()); sheet.on=false; renderSheet(); render(); return;
    case 'add': addToCart(id); render(); return;
    case 'fav': S.favs = S.favs.includes(id)?S.favs.filter(f=>f!==id):[...S.favs,id]; BC.setFavs(S.favs); render(); return;
    case 'cat': S.cat=el.dataset.cat; render(); return;
    case 'veg': S.veg=!S.veg; render(); return;
    case 'inc': case 'dec': {
      const l = S.cart.find(x=>x.id===id && (x.note||'')===(el.dataset.note||'')); if(!l) return;
      l.qty += a==='inc'?1:-1;
      if (l.qty<1) S.cart = S.cart.filter(x=>x!==l);
      BC.setCart(S.cart); render(); return;
    }
    case 'rm': S.cart = S.cart.filter(x=>!(x.id===id && (x.note||'')===(el.dataset.note||''))); BC.setCart(S.cart); render(); return;
    case 'otype': S.bag.type = el.dataset.type; render(); return;
    case 'checkout-step': { const next=Number(el.dataset.step)||1; if(next===2 && !S.cart.length) return toast('Add an item first'); if(next===3){ if(!S.bag.name.trim()) return toast('Add your name'); if(digits(S.bag.phone).length<8) return toast('Add a valid phone'); if(S.bag.type==='delivery'&&!S.bag.address.trim()) return toast('Add your delivery address'); } S.bagStep=Math.min(3,Math.max(1,next)); render(); window.scrollTo({top:0,behavior:'smooth'}); return; }
    case 'promo': { S.promo = ($('#f-promo')?.value||'').trim(); const t = totals(); toast(t.discount?'Promo applied':'Code did not match'); render(); return; }
    case 'locate':
      if (!navigator.geolocation) return toast('No location available');
      toast('Finding you...');
      navigator.geolocation.getCurrentPosition(p => {
        const u = 'https://www.google.com/maps?q='+p.coords.latitude.toFixed(6)+','+p.coords.longitude.toFixed(6);
        S.bag.address = (S.bag.address ? S.bag.address+' | ' : '')+u;
        const b = $('#f-addr'); if (b) b.value = S.bag.address;
        toast('Location added');
      }, () => toast('Could not get location'), { timeout:8000 });
      return;
    case 'send': sendOrder(); return;
    case 'copy': copyText(S.lastOrder?.message || currentOrder()?.message); return;
    case 'rate': S.rating = Number(el.dataset.n); render(); return;
    case 'submit-review': (async () => {
      const name = ($('#rv-name')?.value||'').trim(), text = ($('#rv-text')?.value||'').trim();
      if (!name) return toast('Add your name');
      if (text.length < 8) return toast('Write a little more');
      await BC.addReview({ name:name.slice(0,60), rating:S.rating, text:text.slice(0,900) });
      S.reviews = await BC.getReviews(); render(); toast('Sent for approval');
    })(); return;
  }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.id==='f-name') S.bag.name = t.value;
  else if (t.id==='f-phone') S.bag.phone = t.value;
  else if (t.id==='f-addr') S.bag.address = t.value;
  else if (t.id==='f-notes') S.bag.notes = t.value;
  else if (t.id==='f-promo') S.promo = t.value;
  else if (t.id==='q') {
    S.q = t.value; const p = t.selectionStart;
    render(); const el = $('#q');
    if (el) { el.focus(); el.setSelectionRange(p,p); }
  }
});

window.addEventListener('hashchange', () => { sheet.on=false; window.scrollTo(0,0); render(); });
document.addEventListener('keydown', e => { if (e.key==='Escape' && sheet.on) { sheet.on=false; renderSheet(); } });

/* ---------- INSTALL BAR ---------- */
let deferred = null;
let installBarTimer = null;
const isAppInstalled = () => {
  try {
    return window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.navigator.standalone === true ||
      localStorage.getItem('bc.appInstalled') === '1';
  } catch { return false; }
};
function hideInstallBar (remember=false) {
  const bar = document.getElementById('installbar');
  if (bar) bar.hidden = true;
  if (installBarTimer) { clearTimeout(installBarTimer); installBarTimer = null; }
  if (remember) {
    try { localStorage.setItem('bc.installDismiss', String(Date.now())); } catch {}
  }
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferred = event;
});
window.addEventListener('appinstalled', () => {
  try { localStorage.setItem('bc.appInstalled','1'); } catch {}
  deferred = null;
  hideInstallBar(true);
});
function setupInstall () {
  const bar = document.getElementById('installbar');
  if (!bar) return;
  if (isAppInstalled()) { hideInstallBar(); return; }

  // Keep the close control responsive and prevent the bar from reopening after dismissal.
  const close = document.getElementById('ib-x');
  if (close && !close.dataset.bound) {
    close.dataset.bound = '1';
    close.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      hideInstallBar(true);
    });
  }
  const go = document.getElementById('ib-go');
  if (go && !go.dataset.bound) {
    go.dataset.bound = '1';
    go.addEventListener('click', async event => {
      event.preventDefault();
      if (isAppInstalled()) { hideInstallBar(); return; }
      if (!deferred) {
        toast('Open your browser menu and choose Install app or Add to Home Screen.');
        return;
      }
      const installEvent = deferred;
      deferred = null;
      try {
        await installEvent.prompt();
        const choice = await installEvent.userChoice;
        if (choice?.outcome === 'accepted') {
          hideInstallBar();
          toast('Broccoli Club install started');
        } else {
          const button = document.getElementById('ib-go');
          if (button) button.disabled = false;
        }
      } catch (error) {
        console.warn('Install prompt could not be opened:', error);
        toast('Open your browser menu and choose Install app or Add to Home Screen.');
      }
    });
  }

  let dismissedAt = 0;
  try { dismissedAt = Number(localStorage.getItem('bc.installDismiss') || 0); } catch {}
  if (dismissedAt && Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return;
  installBarTimer = window.setTimeout(() => {
    if (!isAppInstalled() && bar.isConnected) bar.hidden = false;
  }, deferred ? 1200 : 4000);
}
/* ---------- BOOT ---------- */
(async function boot () {
  try {
    BC.init();

    S.content    = await BC.getContent();
    S.settings   = await BC.getSettings();
    S.categories = await BC.getCategories();
    const requestedCategory = new URLSearchParams(window.location.search).get('category');
    if (requestedCategory && S.categories.some(c=>c.name===requestedCategory && c.active!==false)) S.cat = requestedCategory;
    S.products   = await BC.getProducts();
    S.reviews    = await BC.getReviews();
    S.pages      = await BC.getPages();

    S.cart      = BC.getCart().map(l=>({...l, product:l.product || S.products.find(p=>p.id===l.id) || {id:l.id,name:'Unavailable item',price:0,image:'',category:'',description:'This item is no longer available. Remove it and add it again.'}}));
    BC.setCart(S.cart);
    S.favs      = BC.getFavs();
    S.lastOrder = BC.getLastOrder();

    document.title = (S.content.shopName || 'Broccoli Club') + ' · Good food. Better mood.';

    if (!window.location.hash) {
      window.location.hash = onMenuDoc() ? '#/menu' : '#/home';
    }

    render();
    setupInstall();
  } catch (error) {
    console.error('Broccoli Club startup failed:', error);
    const app = document.querySelector('#app');
    if (app) {
      app.innerHTML = `
        <main style="padding:24px;font-family:sans-serif">
          <h2>Unable to start Broccoli Club</h2>
          <p>The app hit a startup error. Refresh once; if it continues, clear this site's cached data and reload.</p>
          <details style="margin-top:16px"><summary>Technical details</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${esc(String(error && (error.stack || error.message) || error))}</pre></details>
          <button type="button" onclick="location.reload()" style="margin-top:16px;padding:12px 18px;border:0;border-radius:10px;background:#06301c;color:white">Reload app</button>
        </main>`;
    }
  }
})();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));

}
