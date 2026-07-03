import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
import type { Product } from "@/lib/types";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase.from("products").select("*").eq("id", params.id).maybeSingle();

  if (!data) notFound();

  return (
    <div>
      <h1 className="text-xl font-bold text-navy mb-6">Edit Product</h1>
      <ProductForm product={data as Product} />
    </div>
  );
}
