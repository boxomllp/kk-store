"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pixel } from "@/lib/types";

const EVENT_LABELS: { key: keyof Pixel["events"]; label: string }[] = [
  { key: "pageView", label: "PageView" },
  { key: "viewContent", label: "ViewContent" },
  { key: "addToCart", label: "AddToCart" },
  { key: "initiateCheckout", label: "InitiateCheckout" },
  { key: "purchase", label: "Purchase" },
];

const EMPTY_PIXEL: Omit<Pixel, "id"> = {
  label: "",
  pixel_id: "",
  ad_account_id: "",
  active: true,
  events: { pageView: true, viewContent: true, addToCart: true, initiateCheckout: true, purchase: true },
  test_mode: false,
};

export default function AdminPixelsPage() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("pixels").select("*").then(({ data }) => {
      setPixels((data ?? []) as Pixel[]);
      setLoading(false);
    });
  }, []);

  function addPixel() {
    if (pixels.length >= 5) return;
    setPixels((prev) => [...prev, { ...EMPTY_PIXEL, id: `new-${Date.now()}` }]);
  }

  function updatePixel(id: string, patch: Partial<Pixel>) {
    setPixels((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function updateEvent(id: string, key: keyof Pixel["events"], value: boolean) {
    setPixels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, events: { ...p.events, [key]: value } } : p))
    );
  }

  function removePixel(id: string) {
    setPixels((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSaveAll() {
    setSaving(true);
    const supabase = createClient();
    for (const p of pixels) {
      const payload = {
        label: p.label,
        pixel_id: p.pixel_id,
        ad_account_id: p.ad_account_id,
        active: p.active,
        events: p.events,
        test_mode: p.test_mode,
      };
      if (p.id.startsWith("new-")) {
        await supabase.from("pixels").insert(payload);
      } else {
        await supabase.from("pixels").update(payload).eq("id", p.id);
      }
    }
    const { data } = await supabase.from("pixels").select("*");
    setPixels((data ?? []) as Pixel[]);
    setSaving(false);
  }

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy">Pixel Manager</h1>
        <div className="flex gap-2">
          <button
            onClick={addPixel}
            disabled={pixels.length >= 5}
            className="bg-gray-100 text-navy text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40"
          >
            + Add Pixel ({pixels.length}/5)
          </button>
          <button onClick={handleSaveAll} disabled={saving} className="bg-cta text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
            {saving ? "Saving..." : "Save All"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {pixels.map((p) => (
          <div key={p.id} className="bg-white border rounded-xl p-5 space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Label</label>
                <input value={p.label || ""} onChange={(e) => updatePixel(p.id, { label: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Pixel ID</label>
                <input value={p.pixel_id} onChange={(e) => updatePixel(p.id, { pixel_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Ad Account ID</label>
                <input value={p.ad_account_id || ""} onChange={(e) => updatePixel(p.id, { ad_account_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 mt-1" />
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={p.active} onChange={(e) => updatePixel(p.id, { active: e.target.checked })} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={p.test_mode} onChange={(e) => updatePixel(p.id, { test_mode: e.target.checked })} />
                Test Mode
              </label>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Events</label>
              <div className="flex flex-wrap gap-4">
                {EVENT_LABELS.map((ev) => (
                  <label key={ev.key} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={p.events[ev.key]}
                      onChange={(e) => updateEvent(p.id, ev.key, e.target.checked)}
                    />
                    {ev.label}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={() => removePixel(p.id)} className="text-red-500 text-sm font-medium">
              Remove Pixel
            </button>
          </div>
        ))}
        {pixels.length === 0 && <p className="text-gray-400 text-sm">No pixels configured yet.</p>}
      </div>
    </div>
  );
}
