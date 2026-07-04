-- Additional homepage settings for the new marketing sections
insert into store_settings (key, value) values
  ('secondary_banner_image', ''),
  ('secondary_banner_heading', 'Smart. Stylish. Affordable.'),
  ('secondary_banner_subheading', 'Make everyday life a little easier.')
on conflict (key) do nothing;

-- Update existing default color settings to the new amber theme
-- (safe no-op for rows that don't exist; for existing installs, run manually
-- if you want the defaults refreshed — this won't override values you've
-- already customized in the admin panel)
