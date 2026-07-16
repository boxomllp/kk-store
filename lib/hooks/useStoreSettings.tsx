"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

export type StoreSettings = Record<string, string>;

const DEFAULTS: StoreSettings = {
  store_name: "Kleezo Shop",
  logo_url: "",
  favicon_url: "",
  contact_email: "",
  contact_phone: "",
  whatsapp_number: "",
  store_address: "",
  header_bg_color: "#ffffff",
  header_text_color: "#0f172a",
  announcement_text: "Free Shipping on all orders!",
  announcement_bg_color: "#F2A93B",
  announcement_text_color: "#1a1a1a",
  announcement_link: "",
  announcement_show: "true",
  hero_image: "",
  hero_headline: "Welcome to Kleezo Shop",
  hero_subheadline: "Quality products, delivered to your door",
  hero_cta_text: "Shop Now",
  hero_cta_link: "/products",
  featured_products: "[]",
  homepage_meta_title: "Kleezo Shop",
  homepage_meta_description: "Shop the best products with COD",
  footer_description: "",
  instagram_url: "",
  facebook_url: "",
  youtube_url: "",
  footer_whatsapp_url: "",
  footer_bg_color: "#F2A93B",
  footer_text_color: "#1a1a1a",
  copyright_text: "© 2026 Kleezo Shop. All rights reserved.",
  order_ready_days: "1",
  delivery_days: "4",
  free_shipping_above: "999",
  cod_available: "true",
  trust_badges_show: "true",
  trust_badge_1: '{"emoji":"✅","text":"Verified Business"}',
  trust_badge_2: '{"emoji":"🔒","text":"Secured Payments"}',
  trust_badge_3: '{"emoji":"💬","text":"Prompt Support"}',
  popup_heading: "Complete Your Order",
  otp_button_text: "Buy Now",
  confirm_button_text: "Confirm Order",
  show_delivery_timeline_popup: "true",
  show_cod_badge: "true",
  cod_badge_text: "Cash on Delivery Available",
  otp_digit_length: "4",
  otp_expiry_minutes: "10",
  otp_test_mode: "false",
};

type Ctx = {
  settings: StoreSettings;
  loading: boolean;
};

const StoreSettingsContext = createContext<Ctx>({ settings: DEFAULTS, loading: true });

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase
      .from("store_settings")
      .select("key,value")
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) {
          const merged = { ...DEFAULTS };
          data.forEach((row: { key: string; value: string }) => {
            merged[row.key] = row.value ?? merged[row.key];
          });
          setSettings(merged);
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <StoreSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
