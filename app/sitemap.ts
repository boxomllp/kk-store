import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://kk-store.vercel.app";
  const supabase = createClient();

  const [{ data: products }, { data: pages }] = await Promise.all([
    supabase.from("products").select("slug").eq("active", true),
    supabase.from("pages").select("slug"),
  ]);

  const productUrls = (products ?? []).map((p) => ({
    url: `${base}/products/${p.slug}`,
    lastModified: new Date(),
  }));

  const pageUrls = (pages ?? []).map((p) => ({
    url: `${base}/${p.slug}`,
    lastModified: new Date(),
  }));

  return [{ url: base, lastModified: new Date() }, ...productUrls, ...pageUrls];
}
