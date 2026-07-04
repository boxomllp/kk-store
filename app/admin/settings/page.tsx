"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/types";

const TABS = ["General", "Header & Announcement", "Homepage", "Footer", "Delivery & Shipping", "Trust Badges"] as const;

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("General");
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("store_settings").select("key,value"),
      supabase.from("products").select("*").eq("active", true),
    ]).then(([settingsRes, productsRes]) => {
      const map: Record<string, string> = {};
      (settingsRes.data ?? []).forEach((r) => (map[r.key] = r.value));
      setSettings(map);
      setProducts((productsRes.data ?? []) as Product[]);
      setLoading(false);
    });
  }, []);

  function set(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  async function uploadFile(key: string, file: File) {
    const supabase = createClient();
    const path = `settings/${key}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) return;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    set(key, data.publicUrl);
  }

  async function handleSaveAll() {
    setSaving(true);
    const supabase = createClient();
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    await supabase.from("store_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    setSaved(true);
  }

  function toggleFeatured(id: string) {
    let ids: string[] = [];
    try {
      ids = JSON.parse(settings.featured_products || "[]");
    } catch {
      ids = [];
    }
    if (ids.includes(id)) ids = ids.filter((x) => x !== id);
    else ids.push(id);
    set("featured_products", JSON.stringify(ids));
  }

  if (loading) return <p className="text-gray-400">Loading...</p>;

  let featuredIds: string[] = [];
  try {
    featuredIds = JSON.parse(settings.featured_products || "[]");
  } catch {}

  const badge1 = safeParse(settings.trust_badge_1);
  const badge2 = safeParse(settings.trust_badge_2);
  const badge3 = safeParse(settings.trust_badge_3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-navy">Store Settings</h1>
        <button onClick={handleSaveAll} disabled={saving} className="bg-cta text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
          {saving ? "Saving..." : saved ? "Saved ✓" : "Save All"}
        </button>
      </div>

      <div className="flex gap-1 border-b mb-5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm whitespace-nowrap border-b-2 ${
              tab === t ? "border-cta text-cta font-medium" : "border-transparent text-gray-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4 max-w-2xl">
        {tab === "General" && (
          <>
            <Field label="Store Name" value={settings.store_name} onChange={(v) => set("store_name", v)} />
            <FileField label="Logo" value={settings.logo_url} onChange={(v) => set("logo_url", v)} onUpload={(f) => uploadFile("logo_url", f)} />
            <FileField label="Favicon" value={settings.favicon_url} onChange={(v) => set("favicon_url", v)} onUpload={(f) => uploadFile("favicon_url", f)} />
            <Field label="Email" value={settings.contact_email} onChange={(v) => set("contact_email", v)} />
            <Field label="Phone" value={settings.contact_phone} onChange={(v) => set("contact_phone", v)} />
            <Field label="WhatsApp" value={settings.whatsapp_number} onChange={(v) => set("whatsapp_number", v)} />
            <Field label="Address" value={settings.store_address} onChange={(v) => set("store_address", v)} textarea />
          </>
        )}

        {tab === "Header & Announcement" && (
          <>
            <ColorField label="Header Background" value={settings.header_bg_color} onChange={(v) => set("header_bg_color", v)} />
            <ColorField label="Header Text Color" value={settings.header_text_color} onChange={(v) => set("header_text_color", v)} />
            <Field label="Announcement Text" value={settings.announcement_text} onChange={(v) => set("announcement_text", v)} />
            <ColorField label="Announcement Background" value={settings.announcement_bg_color} onChange={(v) => set("announcement_bg_color", v)} />
            <ColorField label="Announcement Text Color" value={settings.announcement_text_color} onChange={(v) => set("announcement_text_color", v)} />
            <Field label="Announcement Link" value={settings.announcement_link} onChange={(v) => set("announcement_link", v)} />
            <ToggleField label="Show Announcement Bar" value={settings.announcement_show === "true"} onChange={(v) => set("announcement_show", String(v))} />
          </>
        )}

        {tab === "Homepage" && (
          <>
            <FileField label="Hero Image (recommended 1600×1200px)" value={settings.hero_image} onChange={(v) => set("hero_image", v)} onUpload={(f) => uploadFile("hero_image", f)} />
            <Field label="Hero Headline" value={settings.hero_headline} onChange={(v) => set("hero_headline", v)} />
            <Field label="Hero Subheadline" value={settings.hero_subheadline} onChange={(v) => set("hero_subheadline", v)} textarea />
            <Field label="CTA Button Text" value={settings.hero_cta_text} onChange={(v) => set("hero_cta_text", v)} />
            <Field label="CTA Button Link" value={settings.hero_cta_link} onChange={(v) => set("hero_cta_link", v)} />
            <div>
              <label className="text-sm font-medium block mb-2">Featured Products</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1.5">
                    <input type="checkbox" checked={featuredIds.includes(p.id)} onChange={() => toggleFeatured(p.id)} />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
            <Field label="Homepage Meta Title" value={settings.homepage_meta_title} onChange={(v) => set("homepage_meta_title", v)} />
            <Field label="Homepage Meta Description" value={settings.homepage_meta_description} onChange={(v) => set("homepage_meta_description", v)} textarea />
            <div className="border-t pt-4">
              <p className="text-sm font-semibold text-navy mb-2">Secondary Banner Section</p>
              <FileField label="Banner Image (recommended 1200×900px)" value={settings.secondary_banner_image} onChange={(v) => set("secondary_banner_image", v)} onUpload={(f) => uploadFile("secondary_banner_image", f)} />
              <div className="mt-3">
                <Field label="Banner Heading" value={settings.secondary_banner_heading} onChange={(v) => set("secondary_banner_heading", v)} />
              </div>
            </div>
          </>
        )}

        {tab === "Footer" && (
          <>
            <Field label="Description" value={settings.footer_description} onChange={(v) => set("footer_description", v)} textarea />
            <Field label="Instagram URL" value={settings.instagram_url} onChange={(v) => set("instagram_url", v)} />
            <Field label="Facebook URL" value={settings.facebook_url} onChange={(v) => set("facebook_url", v)} />
            <Field label="YouTube URL" value={settings.youtube_url} onChange={(v) => set("youtube_url", v)} />
            <Field label="WhatsApp URL" value={settings.footer_whatsapp_url} onChange={(v) => set("footer_whatsapp_url", v)} />
            <ColorField label="Footer Background" value={settings.footer_bg_color} onChange={(v) => set("footer_bg_color", v)} />
            <ColorField label="Footer Text Color" value={settings.footer_text_color} onChange={(v) => set("footer_text_color", v)} />
            <Field label="Copyright Text" value={settings.copyright_text} onChange={(v) => set("copyright_text", v)} />
          </>
        )}

        {tab === "Delivery & Shipping" && (
          <>
            <Field label="Order Ready Days" value={settings.order_ready_days} onChange={(v) => set("order_ready_days", v)} type="number" />
            <Field label="Delivered Days" value={settings.delivery_days} onChange={(v) => set("delivery_days", v)} type="number" />
            <Field label="Free Shipping Above (₹)" value={settings.free_shipping_above} onChange={(v) => set("free_shipping_above", v)} type="number" />
            <ToggleField label="COD Available" value={settings.cod_available === "true"} onChange={(v) => set("cod_available", String(v))} />
          </>
        )}

        {tab === "Trust Badges" && (
          <>
            <ToggleField label="Show Trust Badges Section" value={settings.trust_badges_show === "true"} onChange={(v) => set("trust_badges_show", String(v))} />
            {[
              { badge: badge1, key: "trust_badge_1" },
              { badge: badge2, key: "trust_badge_2" },
              { badge: badge3, key: "trust_badge_3" },
            ].map(({ badge, key }, i) => (
              <div key={key} className="flex gap-2">
                <input
                  value={badge.emoji || ""}
                  onChange={(e) => set(key, JSON.stringify({ ...badge, emoji: e.target.value }))}
                  className="w-16 border rounded-lg px-2 py-2 text-center"
                  placeholder="emoji"
                />
                <input
                  value={badge.text || ""}
                  onChange={(e) => set(key, JSON.stringify({ ...badge, text: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2"
                  placeholder={`Badge ${i + 1} text`}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function safeParse(s?: string) {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}

function Field({
  label, value, onChange, textarea, type = "text",
}: { label: string; value?: string; onChange: (v: string) => void; textarea?: boolean; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {textarea ? (
        <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 mt-1" />
      ) : (
        <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value?: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 border rounded" />
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="flex-1 border rounded-lg px-3 py-2" />
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function FileField({
  label, value, onChange, onUpload,
}: { label: string; value?: string; onChange: (v: string) => void; onUpload: (f: File) => void }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-12 h-12 object-cover rounded border" />
        ) : null}
        <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder="URL or upload →" className="flex-1 border rounded-lg px-3 py-2" />
        <label className="text-xs bg-gray-100 px-3 py-2 rounded-lg cursor-pointer">
          Upload
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
        </label>
      </div>
    </div>
  );
}
