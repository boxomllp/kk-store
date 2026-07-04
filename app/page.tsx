import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";
import Link from "next/link";

async function getSettings() {
  const supabase = createClient();
  const { data } = await supabase.from("store_settings").select("key,value");
  const map: Record<string, string> = {};
  (data ?? []).forEach((r) => (map[r.key] = r.value));
  return map;
}

async function getFeaturedProducts(featuredIds: string[]) {
  const supabase = createClient();
  if (!featuredIds.length) {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(8);
    return (data ?? []) as Product[];
  }
  const { data } = await supabase.from("products").select("*").in("id", featuredIds).eq("active", true);
  return (data ?? []) as Product[];
}

function ImageSlot({
  src,
  alt,
  resolution,
  className,
}: {
  src?: string;
  alt: string;
  resolution: string;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  }
  return (
    <div
      className={`${className} flex flex-col items-center justify-center gap-1 bg-orange-50 border-2 border-dashed border-cta/40 rounded-2xl text-center p-4`}
    >
      <span className="text-3xl">🖼️</span>
      <span className="text-xs font-medium text-gray-500">Image not set yet</span>
      <span className="text-[11px] text-gray-400">Recommended: {resolution}</span>
      <span className="text-[11px] text-gray-400">Add from Admin → Store Settings</span>
    </div>
  );
}

export default async function HomePage() {
  const settings = await getSettings();
  let featuredIds: string[] = [];
  try {
    featuredIds = JSON.parse(settings.featured_products || "[]");
  } catch {
    featuredIds = [];
  }
  const products = await getFeaturedProducts(featuredIds);
  const storeName = settings.store_name || "Our Store";

  return (
    <>
      <AnnouncementBar />
      <Header />

      {/* HERO */}
      <section className="relative bg-white wave-divider-bottom pb-20 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid sm:grid-cols-2 gap-8 items-center relative z-10">
          <div>
            <h1
              className="text-4xl sm:text-5xl font-extrabold leading-tight text-cta"
              style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.08)" }}
            >
              {settings.hero_headline || `Discover the Latest from ${storeName}!`}
            </h1>
            <p className="mt-4 text-2xl font-bold text-navy">
              {settings.hero_subheadline || "Where Innovation Meets Style"}
            </p>
            <Link
              href={settings.hero_cta_link || "/products"}
              className="inline-flex items-center gap-3 mt-8 bg-black text-white font-extrabold pl-7 pr-2 py-2 rounded-full hover:opacity-90"
            >
              <span className="uppercase tracking-wide">{settings.hero_cta_text || "Shop Now"}</span>
              <span className="bg-white text-black rounded-full w-9 h-9 flex items-center justify-center text-lg">
                🛒
              </span>
            </Link>
          </div>
          <ImageSlot
            src={settings.hero_image}
            alt="Hero"
            resolution="1600×1200px (4:3), JPG/PNG"
            className="w-full aspect-[4/3] object-cover rounded-2xl"
          />
        </div>
        {/* decorative amber blob behind hero on desktop */}
        <div className="absolute -left-24 top-0 bottom-0 w-1/2 bg-cta/15 rounded-full blur-3xl -z-0 hidden sm:block" />
      </section>

      {/* TRUST BAR */}
      <section className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-600 py-4 border-b">
        <span>🚚 Free Shipping</span>
        <span>💵 Cash on Delivery</span>
        <span>↩️ Easy Returns</span>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-extrabold text-navy mb-6">Featured Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* RESULTS / STATS SECTION */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid sm:grid-cols-2 gap-12">
        <div>
          <h3 className="text-lg font-bold text-cta mb-2">Results heading</h3>
          <h2 className="text-4xl font-extrabold text-navy mb-6">Results</h2>
          <p className="text-gray-600 text-lg">
            At <strong>{storeName}</strong>, we don&apos;t just sell products — we change everyday life for
            the better. Our customers don&apos;t buy products — they buy{" "}
            <strong>solutions</strong>. And the results speak for themselves.
          </p>
        </div>
        <div className="divide-y">
          {[
            "Carefully Curated, Not Random Products",
            "Better Quality at Honest Prices",
            "Trend-Focused & Problem-Solving",
            "Transparent Shopping Experience",
          ].map((text) => (
            <div key={text} className="flex items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full border-4 border-cta flex items-center justify-center font-bold text-cta shrink-0">
                90%
              </div>
              <span className="font-medium text-navy">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* TRUST MARQUEE STRIP */}
      <section className="bg-cta text-white py-3 overflow-hidden">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-1 text-sm font-bold px-4">
          <span>💡 Smart Solutions for Daily Problems</span>
          <span>💯 Quality Tested · Customer Approved</span>
          <span>🔥 India&apos;s Trending Lifestyle Products</span>
        </div>
      </section>

      {/* SECONDARY BANNER */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid sm:grid-cols-2 gap-8 items-center">
        <ImageSlot
          src={settings.secondary_banner_image}
          alt="Lifestyle banner"
          resolution="1200×900px (4:3), JPG/PNG"
          className="w-full aspect-[4/3] object-cover rounded-2xl order-2 sm:order-1"
        />
        <h2 className="text-3xl sm:text-4xl font-extrabold text-navy order-1 sm:order-2">
          {settings.secondary_banner_heading || "Smart. Stylish. Affordable."}{" "}
          <span className="text-cta">Make Your Home Trendy!</span>
        </h2>
      </section>

      {/* COMPARISON TABLE */}
      <section className="max-w-6xl mx-auto px-4 py-14 grid sm:grid-cols-2 gap-10 items-start">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-navy">
          Why {storeName} Is Better Than Other Brands
        </h2>
        <div className="border rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-16 bg-cta text-white text-center font-bold text-sm rounded-b-xl px-4 py-2 -translate-y-0">
            {storeName}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-4"></th>
                <th className="p-4 text-center font-bold w-20">&nbsp;</th>
                <th className="p-4 text-center font-bold w-20">Others</th>
              </tr>
            </thead>
            <tbody>
              {["Product Details & Transparency", "Trust & Safety Score", "Secure Payments"].map((row) => (
                <tr key={row} className="border-t">
                  <td className="p-4 font-semibold text-navy">{row}</td>
                  <td className="p-4 text-center text-cta font-bold">✓</td>
                  <td className="p-4 text-center text-gray-400 font-bold">✕</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
        {[
          { title: "Fast & Reliable Delivery", desc: "Quick shipping with safe packaging, right to your doorstep" },
          { title: "Quality Checked Products", desc: "Every product is tested for performance and durability" },
          { title: "Value for Money", desc: "Smart products at honest prices — no overpaying" },
          { title: "Secure Payments", desc: "100% safe checkout with trusted payment options" },
        ].map((item) => (
          <div key={item.title}>
            <div className="w-12 h-12 mx-auto rounded-full bg-cta text-white flex items-center justify-center font-bold mb-3">
              ✓
            </div>
            <h4 className="font-bold text-navy mb-1">{item.title}</h4>
            <p className="text-xs text-gray-500">{item.desc}</p>
          </div>
        ))}
      </section>

      <Footer />
    </>
  );
}
