import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import ProductPageClient from "@/components/ProductPageClient";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", params.slug)
    .eq("active", true)
    .maybeSingle();

  if (!data) notFound();

  return <ProductPageClient product={data as Product} />;
}
