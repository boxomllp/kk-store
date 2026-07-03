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

export default async function HomePage() {
  const settings = await getSettings();
  let featuredIds: string[] = [];
  try {
    featuredIds = JSON.parse(settings.featured_products || "[]");
  } catch {
    featuredIds = [];
  }
  const products = await getFeaturedProducts(featuredIds);

  return (
    <>
      <AnnouncementBar />
      <Header />

      <section className="relative">
        <div
          className="max-w-6xl mx-auto px-4 py-12 sm:py-20 grid sm:grid-cols-2 gap-8 items-center"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-navy leading-tight">
              {settings.hero_headline || "Welcome to our store"}
            </h1>
            <p className="mt-4 text-gray-600 text-lg">{settings.hero_subheadline}</p>
            <Link
              href={settings.hero_cta_link || "/products"}
              className="inline-block mt-6 bg-cta text-white font-bold px-8 py-3 rounded-full hover:opacity-90"
            >
              {settings.hero_cta_text || "Shop Now"}
            </Link>
          </div>
          {settings.hero_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.hero_image} alt="Hero" className="rounded-2xl w-full object-cover" />
          ) : null}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-gray-600 border-y py-4 mb-8">
          <span>🚚 Free Shipping</span>
          <span>💵 Cash on Delivery</span>
          <span>↩️ Easy Returns</span>
        </div>

        <h2 className="text-xl font-bold text-navy mb-4">Featured Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}
