-- =========================================================
-- KK Store — Initial schema, RLS policies, storage bucket
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- products ----------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  short_description text,
  description_html text,
  ingredients_html text,
  how_to_use_html text,
  faqs jsonb default '[]'::jsonb,
  price numeric not null,
  compare_price numeric,
  images jsonb default '[]'::jsonb,
  stock integer default 0,
  sku text,
  trust_badges jsonb default '[]'::jsonb,
  meta_title text,
  meta_description text,
  active boolean default true,
  variants jsonb default '{"enabled": false, "label": "", "options": []}'::jsonb,
  created_at timestamptz default now()
);

-- ---------- order_counter (must exist before orders trigger uses it) ----------
create table if not exists order_counter (
  id integer primary key default 1,
  last_number integer default 10090
);
insert into order_counter (id, last_number)
  values (1, 10090)
  on conflict (id) do nothing;

-- ---------- orders ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique,
  product_id uuid references products(id) on delete set null,
  product_name text,
  product_price numeric,
  variant text,
  customer_name text not null,
  phone text not null,
  address_line1 text not null,
  address_line2 text,
  landmark text,
  city text,
  pincode text,
  state text,
  status text default 'pending'
    check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  verification_status text default 'unverified'
    check (verification_status in ('unverified','verified')),
  tracking_number text,
  created_at timestamptz default now()
);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_phone on orders(phone);
create index if not exists idx_orders_status on orders(status);

-- ---------- pages ----------
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  content_html text,
  show_in_header boolean default false,
  show_in_footer boolean default false,
  created_at timestamptz default now()
);

-- ---------- store_settings ----------
create table if not exists store_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text
);

-- ---------- form_config ----------
create table if not exists form_config (
  id uuid primary key default gen_random_uuid(),
  field_name text not null,
  label text,
  placeholder text,
  required boolean default true,
  visible boolean default true,
  field_type text default 'text', -- text | numeric | dropdown
  min_chars integer default 0,
  sort_order integer default 0
);

-- ---------- pixels ----------
create table if not exists pixels (
  id uuid primary key default gen_random_uuid(),
  label text,
  pixel_id text not null,
  ad_account_id text,
  active boolean default true,
  events jsonb default '{"pageView":true,"viewContent":true,"addToCart":true,"initiateCheckout":true,"purchase":true}'::jsonb,
  test_mode boolean default false
);

-- ---------- otp_verifications ----------
create table if not exists otp_verifications (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_otp_phone on otp_verifications(phone);

-- ---------- user_roles ----------
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'admin'
);
create unique index if not exists idx_user_roles_user_id on user_roles(user_id);

-- =========================================================
-- RLS
-- =========================================================
alter table products enable row level security;
alter table orders enable row level security;
alter table pages enable row level security;
alter table store_settings enable row level security;
alter table form_config enable row level security;
alter table pixels enable row level security;
alter table otp_verifications enable row level security;
alter table order_counter enable row level security;
alter table user_roles enable row level security;

-- helper: is the current user an admin?
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- products: public read, admin write
create policy "products_public_read" on products
  for select to anon, authenticated using (true);
create policy "products_admin_write" on products
  for all to authenticated using (is_admin()) with check (is_admin());

-- orders: public insert, admin read/write
create policy "orders_public_insert" on orders
  for insert to anon, authenticated with check (true);
create policy "orders_admin_select" on orders
  for select to authenticated using (is_admin());
create policy "orders_admin_update" on orders
  for update to authenticated using (is_admin()) with check (is_admin());
create policy "orders_admin_delete" on orders
  for delete to authenticated using (is_admin());

-- pages: public read, admin write
create policy "pages_public_read" on pages
  for select to anon, authenticated using (true);
create policy "pages_admin_write" on pages
  for all to authenticated using (is_admin()) with check (is_admin());

-- store_settings: public read, admin write
create policy "settings_public_read" on store_settings
  for select to anon, authenticated using (true);
create policy "settings_admin_write" on store_settings
  for all to authenticated using (is_admin()) with check (is_admin());

-- form_config: public read, admin write
create policy "form_config_public_read" on form_config
  for select to anon, authenticated using (true);
create policy "form_config_admin_write" on form_config
  for all to authenticated using (is_admin()) with check (is_admin());

-- pixels: public read ONLY active=true, admin write
create policy "pixels_public_read_active" on pixels
  for select to anon, authenticated using (active = true);
create policy "pixels_admin_write" on pixels
  for all to authenticated using (is_admin()) with check (is_admin());

-- otp_verifications: no public access at all (edge functions use service role key)
-- (no policies for anon/authenticated -> RLS blocks everything by default)

-- order_counter: no public access (edge functions use service role key)
-- (no policies -> blocked)

-- user_roles: admin can read own role, only admin can manage
create policy "user_roles_self_read" on user_roles
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "user_roles_admin_write" on user_roles
  for all to authenticated using (is_admin()) with check (is_admin());

-- =========================================================
-- Storage bucket for product images
-- =========================================================
insert into storage.buckets (id, name, public)
  values ('product-images', 'product-images', true)
  on conflict (id) do nothing;

create policy "product_images_public_read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'product-images');
create policy "product_images_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and is_admin());
create policy "product_images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and is_admin());
create policy "product_images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and is_admin());

-- =========================================================
-- Default form_config rows (8 fields per spec)
-- =========================================================
insert into form_config (field_name, label, placeholder, required, visible, field_type, min_chars, sort_order) values
  ('full_name', 'Full Name', 'Enter your full name', true, true, 'text', 3, 1),
  ('phone', 'Phone Number', '10-digit mobile number', true, true, 'numeric', 10, 2),
  ('address_line1', 'Address Line 1', 'House no, street, area', true, true, 'text', 12, 3),
  ('address_line2', 'Address Line 2', 'Apartment, suite, etc. (optional)', false, true, 'text', 0, 4),
  ('landmark', 'Landmark', 'Nearby landmark (optional)', false, true, 'text', 0, 5),
  ('pincode', 'Pincode', '6-digit pincode', true, true, 'numeric', 6, 6),
  ('city', 'City', 'City', true, true, 'text', 0, 7),
  ('state', 'State', 'Select state', true, true, 'dropdown', 0, 8)
on conflict do nothing;

-- =========================================================
-- Default store_settings keys (so storefront never breaks on empty DB)
-- =========================================================
insert into store_settings (key, value) values
  ('store_name', 'KK Store'),
  ('logo_url', ''),
  ('favicon_url', ''),
  ('contact_email', ''),
  ('contact_phone', ''),
  ('whatsapp_number', ''),
  ('store_address', ''),
  ('header_bg_color', '#ffffff'),
  ('header_text_color', '#0f172a'),
  ('announcement_text', 'Free Shipping on all orders!'),
  ('announcement_bg_color', '#0f172a'),
  ('announcement_text_color', '#ffffff'),
  ('announcement_link', ''),
  ('announcement_show', 'true'),
  ('hero_image', ''),
  ('hero_headline', 'Welcome to KK Store'),
  ('hero_subheadline', 'Quality products, delivered to your door'),
  ('hero_cta_text', 'Shop Now'),
  ('hero_cta_link', '/products'),
  ('featured_products', '[]'),
  ('homepage_meta_title', 'KK Store'),
  ('homepage_meta_description', 'Shop the best products with COD'),
  ('footer_description', ''),
  ('instagram_url', ''),
  ('facebook_url', ''),
  ('youtube_url', ''),
  ('footer_whatsapp_url', ''),
  ('footer_bg_color', '#111111'),
  ('footer_text_color', '#ffffff'),
  ('copyright_text', '© 2026 KK Store. All rights reserved.'),
  ('order_ready_days', '1'),
  ('delivery_days', '4'),
  ('free_shipping_above', '999'),
  ('cod_available', 'true'),
  ('trust_badges_show', 'true'),
  ('trust_badge_1', '{"emoji":"✅","text":"Verified Business"}'),
  ('trust_badge_2', '{"emoji":"🔒","text":"Secured Payments"}'),
  ('trust_badge_3', '{"emoji":"💬","text":"Prompt Support"}'),
  ('popup_heading', 'Complete Your Order'),
  ('otp_button_text', 'Buy Now'),
  ('confirm_button_text', 'Confirm Order'),
  ('show_delivery_timeline_popup', 'true'),
  ('show_cod_badge', 'true'),
  ('cod_badge_text', 'Cash on Delivery Available'),
  ('otp_digit_length', '4'),
  ('otp_expiry_minutes', '10'),
  ('otp_test_mode', 'false')
on conflict (key) do nothing;

-- =========================================================
-- Default pages (About Us, Contact, Privacy Policy, T&C, Refund Policy)
-- =========================================================
insert into pages (title, slug, content_html, show_in_header, show_in_footer) values
  ('About Us', 'about-us', '<p>Tell your brand story here.</p>', false, true),
  ('Contact', 'contact', '<p>Contact details go here.</p>', false, true),
  ('Privacy Policy', 'privacy-policy', '<p>Your privacy policy content.</p>', false, true),
  ('Terms & Conditions', 'terms-and-conditions', '<p>Your terms content.</p>', false, true),
  ('Refund & Return Policy', 'refund-and-return-policy', '<p>Your refund/return policy content.</p>', false, true)
on conflict (slug) do nothing;
