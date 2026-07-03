"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FormField } from "@/lib/types";

export default function AdminPopupPage() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from("form_config").select("*").order("sort_order", { ascending: true }),
      supabase.from("store_settings").select("key,value"),
    ]).then(([fieldsRes, settingsRes]) => {
      setFields((fieldsRes.data ?? []) as FormField[]);
      const map: Record<string, string> = {};
      (settingsRes.data ?? []).forEach((r) => (map[r.key] = r.value));
      setSettings(map);
      setLoading(false);
    });
  }, []);

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function moveField(index: number, dir: -1 | 1) {
    const next = [...fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    next.forEach((f, i) => (f.sort_order = i));
    setFields(next);
  }

  function setSetting(key: string, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSaveFormConfig() {
    setSaving(true);
    const supabase = createClient();
    await Promise.all(
      fields.map((f) =>
        supabase
          .from("form_config")
          .update({
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
            visible: f.visible,
            min_chars: f.min_chars,
            field_type: f.field_type,
            sort_order: f.sort_order,
          })
          .eq("id", f.id)
      )
    );
    setSaving(false);
  }

  async function handleSaveAppearance() {
    setSaving(true);
    const supabase = createClient();
    const keys = [
      "popup_heading", "otp_button_text", "confirm_button_text",
      "show_delivery_timeline_popup", "show_cod_badge", "cod_badge_text",
      "otp_digit_length", "otp_expiry_minutes", "otp_test_mode",
    ];
    const rows = keys.map((k) => ({ key: k, value: settings[k] ?? "" }));
    await supabase.from("store_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
  }

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-navy">Popup & Form</h1>

      {/* Section 1 - Form Fields Manager */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-navy">Form Fields Manager</h2>
          <button onClick={handleSaveFormConfig} disabled={saving} className="bg-cta text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
            {saving ? "Saving..." : "Save Form Config"}
          </button>
        </div>
        <div className="space-y-2">
          {fields.map((f, i) => (
            <div key={f.id} className="border rounded-lg p-3 grid sm:grid-cols-6 gap-2 items-center text-sm">
              <div className="flex flex-col">
                <button onClick={() => moveField(i, -1)} className="text-gray-400 hover:text-gray-700">▲</button>
                <button onClick={() => moveField(i, 1)} className="text-gray-400 hover:text-gray-700">▼</button>
              </div>
              <input value={f.label} onChange={(e) => updateField(f.id, { label: e.target.value })} className="border rounded px-2 py-1" placeholder="Label" />
              <input value={f.placeholder || ""} onChange={(e) => updateField(f.id, { placeholder: e.target.value })} className="border rounded px-2 py-1" placeholder="Placeholder" />
              <select value={f.field_type} onChange={(e) => updateField(f.id, { field_type: e.target.value as any })} className="border rounded px-2 py-1">
                <option value="text">text</option>
                <option value="numeric">numeric</option>
                <option value="dropdown">dropdown</option>
              </select>
              <input
                type="number"
                value={f.min_chars}
                onChange={(e) => updateField(f.id, { min_chars: parseInt(e.target.value, 10) || 0 })}
                className="border rounded px-2 py-1"
                placeholder="Min chars"
              />
              <div className="flex gap-3">
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={f.required} onChange={(e) => updateField(f.id, { required: e.target.checked })} /> Req
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={f.visible} onChange={(e) => updateField(f.id, { visible: e.target.checked })} /> Vis
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 - Popup Appearance */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">Popup Appearance</h2>
        <Field label="Popup Heading" value={settings.popup_heading} onChange={(v) => setSetting("popup_heading", v)} />
        <Field label="Buy Now Button Text" value={settings.otp_button_text} onChange={(v) => setSetting("otp_button_text", v)} />
        <Field label="Confirm Button Text" value={settings.confirm_button_text} onChange={(v) => setSetting("confirm_button_text", v)} />
        <ToggleField label="Show Delivery Timeline in Popup" value={settings.show_delivery_timeline_popup === "true"} onChange={(v) => setSetting("show_delivery_timeline_popup", String(v))} />
        <ToggleField label="Show COD Badge" value={settings.show_cod_badge === "true"} onChange={(v) => setSetting("show_cod_badge", String(v))} />
        <Field label="COD Badge Text" value={settings.cod_badge_text} onChange={(v) => setSetting("cod_badge_text", v)} />
      </div>

      {/* Section 3 - OTP Settings */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">OTP Settings</h2>
        <div>
          <label className="text-sm font-medium block mb-1">OTP Digit Length</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" checked={settings.otp_digit_length === "4"} onChange={() => setSetting("otp_digit_length", "4")} /> 4
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" checked={settings.otp_digit_length === "6"} onChange={() => setSetting("otp_digit_length", "6")} /> 6
            </label>
          </div>
        </div>
        <Field label="OTP Expiry Minutes" value={settings.otp_expiry_minutes} onChange={(v) => setSetting("otp_expiry_minutes", v)} type="number" />
        <ToggleField label="Test Mode (accepts 1234 always, skips real SMS)" value={settings.otp_test_mode === "true"} onChange={(v) => setSetting("otp_test_mode", String(v))} />
        {settings.otp_test_mode === "true" && (
          <p className="bg-amber-50 text-amber-800 text-sm px-3 py-2 rounded-lg">
            ⚠️ OTP Test Mode is ON — disable before going live.
          </p>
        )}
        <button onClick={handleSaveAppearance} disabled={saving} className="bg-cta text-white text-sm font-semibold px-5 py-2 rounded-lg disabled:opacity-60">
          {saving ? "Saving..." : "Save Popup Settings"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value?: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
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
