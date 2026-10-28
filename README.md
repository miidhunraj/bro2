# Broccoli Club

Responsive static cloud-kitchen ordering website and PWA.

## Files
- `index.html` — homepage, cart, reviews, location and other public routes.
- `menu.html` — dedicated full menu page.
- `admin.html` — hidden admin dashboard entry; it is not in public navigation.
- `app.js` / `styles.css` — shared application logic and theme.
- `supa.sql` — Supabase schema, RLS policies and admin membership table.
- `sw.js`, `manifest.webmanifest`, `offline.html` — install/offline support.

## Supabase setup
1. Create a Supabase project.
2. In Authentication settings, create an admin user under Authentication → Users.
3. Run `supa.sql` in the SQL Editor.
4. Copy the Auth user's UUID and add it to the admin allowlist:
   `insert into public.admin_users (user_id) values ('YOUR-AUTH-USER-UUID');`
5. In `app.js`, set `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` near the top. Use only the anon/public key in browser code; never use a service-role key.
6. Host the folder on HTTPS. Service workers and PWA install prompts do not work reliably on plain HTTP except localhost.

## Navigation
Public navigation is Home, Menu, Cart and Reviews. The menu has its own `menu.html` page. To open admin, tap Home four times quickly; alternatively open `admin.html` directly. Admin access requires both Supabase Auth and membership in `public.admin_users`.

## Important production note
The current checkout prepares orders in WhatsApp and records the order from the browser. Before taking paid orders or relying on order totals, move order creation and price/discount calculation into a trusted server-side function. Supabase RLS protects admin data, but browser-submitted totals should not be treated as authoritative.


## Latest UI updates\n- Homepage includes a swipeable, image-led Browse by Category carousel using the existing Broccoli Club green/cream/gold theme.\n- Admin → Categories supports image URLs, short descriptions, visibility and ordering; category changes feed the homepage carousel and mobile menu navigation.\n- Mobile menu has a compact category rail beside the product list; desktop retains the normal menu layout.\n- Install prompt now has a reliable close control, hides in installed/standalone mode, responds to the browser `appinstalled` event, and is available from both Home and Menu pages.\n- Footer content is grouped left, with Contact aligned to the right.\n
## Supabase setup (updated)

1. Run `SUPABASE-SETUP.sql` (or `supa.sql`) in the Supabase SQL Editor.
2. Create an admin account in **Authentication → Users**.
3. Add that user's UUID to `public.admin_users`:

   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE_AUTH_USER_UUID_HERE')
   on conflict (user_id) do nothing;
   ```
4. Open `app.js` and set `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` to your project URL and public anon/publishable key.
5. Open `admin.html` and sign in with the authorised admin email and password. The admin page does not ask for project keys.

Never place a Supabase `service_role` or secret key in browser code. Category images, descriptions, visibility and order are edited in **Admin → Categories**.

## Latest UI and admin configuration
- The category gallery is a looping, centre-focused Splide carousel with a gentle 3D tilt, image overlays, captions and working previous/next controls. It keeps the Broccoli Club green/cream/gold palette.
- Cart checkout is split into three screens: items and quantities; pickup/delivery, customer details and coupon; final order review and WhatsApp handoff. Quantity decrement remains available.
- Admin login takes only email and password. Configure `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` in `app.js`; do not enter project keys in the admin page. Authorisation still requires a Supabase Auth user listed in `public.admin_users`.
- Cache version is bumped for this release. After replacing files in GitHub Pages, hard-refresh and, if necessary, unregister the old service worker once.


## Deployment note (2026-10-29)
Extract the ZIP and upload the **contents** of this folder to the root of the `bro2` repository (so `index.html` is at repository root). Do not upload the enclosing folder as a nested directory. After deployment, open DevTools → Application → Service Workers, unregister the old worker once if the previous release remains cached, then hard-refresh. The category carousel uses Splide with a faster 420 ms transition and respects reduced-motion preferences.
