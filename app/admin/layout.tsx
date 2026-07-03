"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/products", label: "Products", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/pages", label: "Pages", icon: "📄" },
  { href: "/admin/settings", label: "Store Settings", icon: "⚙️" },
  { href: "/admin/popup", label: "Popup & Form", icon: "🪟" },
  { href: "/admin/pixels", label: "Pixel Manager", icon: "🎯" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login" || pathname === "/admin/setup") {
    return <>{children}</>;
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 bg-[#111111] text-gray-300 flex flex-col">
        <div className="px-5 py-5 text-white font-bold text-lg border-b border-white/10">KK Admin</div>
        <nav className="flex-1 py-3">
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                  active ? "bg-cta text-white" : "hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button onClick={handleLogout} className="px-5 py-4 text-sm text-left hover:bg-white/5 border-t border-white/10">
          🚪 Logout
        </button>
      </aside>
      <main className="flex-1 bg-gray-50 min-h-screen overflow-x-hidden">
        <div className="p-6 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
