"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useStoreSettings } from "@/lib/hooks/useStoreSettings";
import type { PageRow } from "@/lib/types";

export default function Footer() {
  const { settings } = useStoreSettings();
  const [navPages, setNavPages] = useState<PageRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pages")
      .select("*")
      .eq("show_in_footer", true)
      .then(({ data }) => {
        if (data) setNavPages(data as PageRow[]);
      });
  }, []);

  const socials = [
    { url: settings.instagram_url, label: "Instagram" },
    { url: settings.facebook_url, label: "Facebook" },
    { url: settings.youtube_url, label: "YouTube" },
    { url: settings.footer_whatsapp_url, label: "WhatsApp" },
  ].filter((s) => s.url);

  return (
    <footer
      style={{ backgroundColor: settings.footer_bg_color, color: settings.footer_text_color }}
      className="mt-16"
    >
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <h3 className="font-bold text-lg mb-2">{settings.store_name}</h3>
          <p className="text-sm opacity-80">{settings.footer_description}</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Links</h4>
          <ul className="space-y-1 text-sm">
            {navPages.map((p) => (
              <li key={p.id}>
                <Link href={`/${p.slug}`} className="opacity-80 hover:opacity-100">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Follow Us</h4>
          <ul className="space-y-1 text-sm">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.url} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="text-center text-xs opacity-60 py-4 border-t border-white/10">
        {settings.copyright_text}
      </div>
    </footer>
  );
}
