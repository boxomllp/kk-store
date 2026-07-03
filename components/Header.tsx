"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useStoreSettings } from "@/lib/hooks/useStoreSettings";
import type { PageRow } from "@/lib/types";

export default function Header() {
  const { settings } = useStoreSettings();
  const [navPages, setNavPages] = useState<PageRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("pages")
      .select("*")
      .eq("show_in_header", true)
      .then(({ data }) => {
        if (data) setNavPages(data as PageRow[]);
      });
  }, []);

  return (
    <header
      style={{ backgroundColor: settings.header_bg_color, color: settings.header_text_color }}
      className="sticky top-0 z-40 border-b"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={settings.store_name} className="h-8 w-auto" />
          ) : null}
          <span>{settings.store_name}</span>
        </Link>
        <nav className="hidden sm:flex gap-6 text-sm font-medium">
          {navPages.map((p) => (
            <Link key={p.id} href={`/${p.slug}`} className="hover:text-cta transition-colors">
              {p.title}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
