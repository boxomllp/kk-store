"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStoreSettings } from "@/lib/hooks/useStoreSettings";
import { usePagesNav } from "@/lib/hooks/usePagesNav";

export default function Header() {
  const { settings } = useStoreSettings();
  const pathname = usePathname();
  const { headerPages: navPages } = usePagesNav();

  return (
    <header
      style={{ backgroundColor: settings.header_bg_color, color: settings.header_text_color }}
      className="sticky top-0 z-40 border-b"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <nav className="hidden sm:flex gap-2 text-sm font-semibold">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-full transition-colors ${
              pathname === "/" ? "bg-cta text-navy" : "hover:bg-gray-100"
            }`}
          >
            Home
          </Link>
          {navPages.map((p) => (
            <Link
              key={p.id}
              href={`/${p.slug}`}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                pathname === `/${p.slug}` ? "bg-cta text-navy" : "hover:bg-gray-100"
              }`}
            >
              {p.title}
            </Link>
          ))}
        </nav>

        <Link href="/" className="flex items-center gap-2">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.logo_url} alt={settings.store_name} className="h-10 w-auto" />
          ) : (
            <div className="flex items-center gap-1.5 bg-black text-white pl-2 pr-4 py-1.5 rounded-full">
              <span className="text-xl -rotate-6">🛍️</span>
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-sm tracking-wide">{settings.store_name}</span>
                <span className="text-[9px] text-ctatext tracking-widest">EST. 2026</span>
              </div>
            </div>
          )}
        </Link>

        <div className="flex items-center gap-4 text-lg">
          <span aria-hidden>🔍</span>
          <span aria-hidden>👤</span>
          <span aria-hidden>🛒</span>
        </div>
      </div>
    </header>
  );
}
