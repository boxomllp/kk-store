"use client";

import { useState } from "react";
import Link from "next/link";
import { useStoreSettings } from "@/lib/hooks/useStoreSettings";
import { usePagesNav } from "@/lib/hooks/usePagesNav";

export default function Footer() {
  const { settings } = useStoreSettings();
  const { footerPages: navPages } = usePagesNav();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email) setSubscribed(true);
  }

  return (
    <footer
      style={{ backgroundColor: settings.footer_bg_color, color: settings.footer_text_color }}
      className="wave-divider-top mt-24 pt-14"
    >
      <div className="max-w-6xl mx-auto px-4 pb-10 grid gap-10 sm:grid-cols-2">
        <div>
          <h3 className="font-extrabold text-2xl mb-4">Quick links</h3>
          <ul className="space-y-2 text-sm font-medium">
            {navPages.map((p) => (
              <li key={p.id}>
                <Link href={`/${p.slug}`} className="opacity-90 hover:opacity-100">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-extrabold text-2xl mb-4">Subscribe to our emails</h3>
          <p className="text-sm opacity-90 mb-4">Join our email list for exclusive offers and the latest news.</p>
          {subscribed ? (
            <p className="text-sm font-semibold">Thanks for subscribing! 🎉</p>
          ) : (
            <form onSubmit={handleSubscribe} className="max-w-sm">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-transparent border border-white/60 placeholder-white/80 rounded-lg px-4 py-3 mb-3 outline-none"
              />
              <button type="submit" className="w-full bg-white text-cta font-bold rounded-lg py-3">
                Sign up
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="text-center text-xs opacity-90 py-4 border-t border-white/20">
        {settings.copyright_text}
      </div>
    </footer>
  );
}
