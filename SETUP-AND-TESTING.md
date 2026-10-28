# Broccoli Club — setup and testing

## Files to keep
Keep the entire `bro2-main` folder together. Do not delete `menu.html`, `admin.html`, `app.js`, `styles.css`, `supa.sql`, `supabase/schema.sql`, `sw.js`, `manifest.webmanifest`, `offline.html`, `icons/`, or `images/`. The menu page and offline/PWA files are referenced by the app.

## Run locally on Windows
1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Use the Live Server extension to open `index.html` (or run `python -m http.server 8080` from the folder and open `http://localhost:8080`). Avoid opening the file directly with `file://`, because authentication/PWA features need a web origin.
4. Test Home, Menu, Cart, Reviews, product add/remove, search/filter, checkout-to-WhatsApp, and mobile navigation.

## Supabase and admin
The app has placeholder `SUPABASE_URL` and `SUPABASE_ANON_KEY` values in `app.js`; replace them with your project's URL and public anon/publishable key. To enable online database/auth, set those two values to your project's URL and **anon/public** key. Never put a Supabase service-role key or a fixed admin password in browser code. Run `supa.sql` in the Supabase SQL editor, create the admin user in Authentication, and add that user's UUID to `public.admin_users` as described in `README.md`. Until this is configured, the app uses local browser storage where supported and the admin login cannot authenticate against Supabase.

## Admin shortcut
On the public site, tap the Home navigation item four times quickly to open `admin.html`. Admin access still requires a valid Supabase-authenticated user who is listed in `public.admin_users`.

## Responsive layout
The stylesheet includes desktop layouts at 768px and wider and a fixed bottom navigation on smaller screens. Test at desktop full-screen width and a narrow mobile viewport in browser developer tools, then on a real phone before launch.

## Production caveat
This ZIP has had the unmatched closing brace in `app.js` repaired and the JavaScript syntax check passes. That is not a substitute for live end-to-end testing with your own Supabase project and WhatsApp destination. Verify database policies, order creation, and all admin CRUD actions before accepting real orders.

\n## Category carousel images\n\nThe homepage category carousel uses each category's image URL and short description. In Admin → Categories, edit or add a category and provide an externally hosted HTTPS image URL. The mobile menu uses the same category data for its left-side category rail. If the Supabase database was created before these fields were added, run the updated `supa.sql` (or `supabase/schema.sql`) in the Supabase SQL Editor; the `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements add the new fields without deleting existing data.\n\n## PWA install prompt\n\nThe install bar is shared by the home and menu entry pages. It hides when the app is running in standalone/fullscreen mode or after the browser fires `appinstalled`; closing it dismisses it for 24 hours. Install prompts require HTTPS (or localhost) and browser support.\n

## Latest UI and admin configuration
- The category gallery is a looping, centre-focused Splide carousel with a gentle 3D tilt, image overlays, captions and working previous/next controls. It keeps the Broccoli Club green/cream/gold palette.
- Cart checkout is split into three screens: items and quantities; pickup/delivery, customer details and coupon; final order review and WhatsApp handoff. Quantity decrement remains available.
- Admin login takes only email and password. Configure `CONFIG.SUPABASE_URL` and `CONFIG.SUPABASE_ANON_KEY` in `app.js`; do not enter project keys in the admin page. Authorisation still requires a Supabase Auth user listed in `public.admin_users`.
- Cache version is bumped for this release. After replacing files in GitHub Pages, hard-refresh and, if necessary, unregister the old service worker once.


## Deployment note (2026-10-29)
Extract the ZIP and upload the **contents** of this folder to the root of the `bro2` repository (so `index.html` is at repository root). Do not upload the enclosing folder as a nested directory. After deployment, open DevTools → Application → Service Workers, unregister the old worker once if the previous release remains cached, then hard-refresh. The category carousel uses Splide with a faster 420 ms transition and respects reduced-motion preferences.
