# KK Store — Full Build (Next.js 14 + Supabase + Vercel)

Poora COD D2C e-commerce store, spec ke saare 17 build steps ke saath complete.

## ✅ Kya-kya ban chuka hai

**Database (supabase/migrations/)**
- Poora schema: products, orders, pages, store_settings, form_config, pixels,
  otp_verifications, order_counter, user_roles
- Saari RLS policies (exact spec ke mutabiq — public read/insert, admin write, OTP/counter locked)
- `product-images` storage bucket + policies
- Atomic `increment_order_counter()` function — 2000+ daily orders mein bhi race-condition safe
- Default seed data: 8 form fields, saari store_settings keys, 5 default pages

**Edge Functions (supabase/functions/)**
- `setup-admin` — one-time first admin creation, SETUP_ADMIN_SECRET se protected
- `send-otp` — rate limit (3/hr), SHA-256 hash, APIHome SMS, test mode
- `verify-otp` — hash+expiry+used check, order verification update
- `create-order` — atomic sequential order numbers (KK10091...)

**Public Storefront**
- Home page (hero, featured products, trust bar) — sab store_settings se
- Header/Footer/Announcement bar — pages table + store_settings se driven
- Product page — gallery, variant selector, delivery timeline, trust badges,
  tabs (Description/Ingredients/How to Use/FAQs), sticky bottom bar
  (scroll-listener based, IntersectionObserver NAHI use kiya, spec ke mutabiq)
- Buy Now Popup — mobile-safe fixed div (NO Sheet/Drawer/Dialog), form + OTP steps,
  mobile back-button intercept, resend countdown, change-number flow, pincode
  auto-fill via postalpincode.in
- Thank You page
- Custom pages (/about-us, /privacy-policy, etc.) via [slug] route
- Facebook Pixel system — fbq injection, PageView/ViewContent/AddToCart/
  InitiateCheckout/Purchase events, test mode support, multi-pixel

**Admin Panel (/admin)**
- Auth (Supabase Auth) + middleware route protection + setup page
- Dashboard — stats cards, recent orders
- Products — full CRUD, TipTap rich text (description/ingredients/how-to-use),
  FAQs, variants, images (Supabase Storage), trust badges, SEO fields
- Orders — search/status/verification/date filters, bulk status update,
  detail dialog with tracking number, CSV export (STATE_CODES short form)
- Pages — TipTap editor, header/footer toggles
- Store Settings — all 6 tabs (General, Header & Announcement, Homepage,
  Footer, Delivery & Shipping, Trust Badges)
- Popup & Form — form fields manager (reorder/toggle/edit), popup appearance,
  OTP settings (digit length, expiry, test mode warning banner)
- Pixel Manager — up to 5 pixels, per-pixel events, test mode

## ✅ Verified in this sandbox
- `npm install` — clean
- `npx tsc --noEmit` — 0 errors
- `npm run build` — all 16 routes compile successfully (production build)
- Next.js pinned to `14.2.35` (patched — 14.2.5 had a known Dec 2025 RSC
  vulnerability, CVE-2025-55184 / CVE-2025-55183)

Note: Next.js 14.x is officially EOL (Oct 2025). It's fully functional and
patched, but if you want long-term security support, migrating to Next.js 15
later is worth considering — not urgent for launch.

## 🚀 Deploy Steps

### 1. Supabase
```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase functions deploy setup-admin
supabase functions deploy send-otp
supabase functions deploy verify-otp
supabase functions deploy create-order
supabase secrets set APIHOME_API_KEY=your_apihome_key
supabase secrets set SETUP_ADMIN_SECRET=some_random_string
```

### 2. Environment variables
Copy `.env.local.example` → `.env.local` and fill in your Supabase URL + anon key.

### 3. Install & run locally
```bash
npm install
npm run dev
```

### 4. Create first admin
Visit `/admin/setup`, enter your SETUP_ADMIN_SECRET + email + password.
This route only works once (fails if an admin already exists).

### 5. Deploy to Vercel
```bash
git init && git add -A && git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```
Then import the repo in Vercel, set the same env vars there, deploy.

### 6. Add your first product & configure settings
Login at `/admin/login` → Products → Add Product, then Store Settings →
fill in your brand details, then Pixel Manager → add your Facebook Pixel.

## 📁 Structure
```
app/                    → Next.js App Router pages (storefront + admin)
components/             → shared UI components
components/admin/       → admin-only components (RichTextEditor, ProductForm)
lib/supabase/           → browser/server Supabase clients
lib/hooks/               → useStoreSettings, usePixel
lib/types.ts             → shared TypeScript types
middleware.ts            → session refresh + admin route protection
supabase/migrations/     → SQL schema + RLS
supabase/functions/      → Deno edge functions
```
