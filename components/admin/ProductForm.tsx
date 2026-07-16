"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/uploadImage";
import RichTextEditor from "@/components/admin/RichTextEditor";
import type { Product, VariantOption } from "@/lib/types";

type Props = { product?: Product };

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ product }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!product;

  const [name, setName] = useState(product?.name || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [slugEdited, setSlugEdited] = useState(false);
  const [shortDescription, setShortDescription] = useState(product?.short_description || "");
  const [descriptionHtml, setDescriptionHtml] = useState(product?.description_html || "");
  const [ingredientsHtml, setIngredientsHtml] = useState(product?.ingredients_html || "");
  const [howToUseHtml, setHowToUseHtml] = useState(product?.how_to_use_html || "");
  const [faqs, setFaqs] = useState(product?.faqs || []);
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [comparePrice, setComparePrice] = useState(product?.compare_price?.toString() || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [stock, setStock] = useState(product?.stock?.toString() || "0");
  const [sku, setSku] = useState(product?.sku || "");
  const [trustBadges, setTrustBadges] = useState(
    product?.trust_badges?.length ? product.trust_badges : [
      { icon: "✅", text: "" }, { icon: "🔒", text: "" }, { icon: "💬", text: "" },
    ]
  );
  const [metaTitle, setMetaTitle] = useState(product?.meta_title || "");
  const [metaDescription, setMetaDescription] = useState(product?.meta_description || "");
  const [active, setActive] = useState(product?.active ?? true);
  const [variantsEnabled, setVariantsEnabled] = useState(product?.variants?.enabled || false);
  const [variantLabel, setVariantLabel] = useState(product?.variants?.label || "");
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>(product?.variants?.options || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(v: string) {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    const urls: string[] = [];
    const failedNames: string[] = [];
    for (const file of Array.from(files)) {
      const path = `products/${Date.now()}-${file.name}`;
      const { url, error: uploadErr } = await uploadImage(file, path);
      if (url) urls.push(url);
      else failedNames.push(`${file.name}${uploadErr ? ` (${uploadErr})` : ""}`);
    }
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
    if (failedNames.length) {
      setError(`Failed to upload: ${failedNames.join(", ")}`);
    }
    e.target.value = "";
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addFaq() {
    setFaqs([...faqs, { question: "", answer: "" }]);
  }
  function updateFaq(i: number, field: "question" | "answer", value: string) {
    const next = [...faqs];
    next[i] = { ...next[i], [field]: value };
    setFaqs(next);
  }
  function removeFaq(i: number) {
    setFaqs(faqs.filter((_, idx) => idx !== i));
  }

  function addVariantOption() {
    setVariantOptions([...variantOptions, { name: "", price: parseFloat(price) || 0, compare_price: undefined, default: variantOptions.length === 0 }]);
  }
  function updateVariantOption(i: number, patch: Partial<VariantOption>) {
    const next = [...variantOptions];
    next[i] = { ...next[i], ...patch };
    setVariantOptions(next);
  }
  function removeVariantOption(i: number) {
    setVariantOptions(variantOptions.filter((_, idx) => idx !== i));
  }
  function setDefaultVariant(i: number) {
    setVariantOptions(variantOptions.map((o, idx) => ({ ...o, default: idx === i })));
  }

  async function handleSave() {
    setError("");
    if (!name.trim() || !slug.trim() || !price) {
      setError("Name, slug, and price are required");
      return;
    }
    setSaving(true);

    const payload = {
      name,
      slug,
      short_description: shortDescription,
      description_html: descriptionHtml,
      ingredients_html: ingredientsHtml,
      how_to_use_html: howToUseHtml,
      faqs,
      price: parseFloat(price),
      compare_price: comparePrice ? parseFloat(comparePrice) : null,
      images,
      stock: parseInt(stock, 10) || 0,
      sku,
      trust_badges: trustBadges,
      meta_title: metaTitle,
      meta_description: metaDescription,
      active,
      variants: { enabled: variantsEnabled, label: variantLabel, options: variantOptions },
    };

    const { error: saveError } = isEdit
      ? await supabase.from("products").update(payload).eq("id", product!.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">Basic Info</h2>
        <div>
          <label className="text-sm font-medium">Name</label>
          <input value={name} onChange={(e) => handleNameChange(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Short Description (one bullet per line)</label>
          <textarea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 mt-1"
          />
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-navy">Rich Content</h2>
        <div>
          <label className="text-sm font-medium block mb-1">Description</label>
          <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Ingredients</label>
          <RichTextEditor value={ingredientsHtml} onChange={setIngredientsHtml} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">How to Use</label>
          <RichTextEditor value={howToUseHtml} onChange={setHowToUseHtml} />
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-navy">FAQs</h2>
          <button onClick={addFaq} className="text-sm text-ctatext font-medium">+ Add FAQ</button>
        </div>
        {faqs.map((f, i) => (
          <div key={i} className="border rounded-lg p-3 space-y-2">
            <div className="flex justify-between">
              <input
                placeholder="Question"
                value={f.question}
                onChange={(e) => updateFaq(i, "question", e.target.value)}
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm mr-2"
              />
              <button onClick={() => removeFaq(i)} className="text-red-500 text-sm">Remove</button>
            </div>
            <textarea
              placeholder="Answer"
              value={f.answer}
              onChange={(e) => updateFaq(i, "answer", e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">Pricing & Inventory</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Price (₹)</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Compare / MRP (₹)</label>
            <input type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Stock</label>
            <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">SKU</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative w-20 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover rounded-lg border" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <label className="inline-block text-sm bg-gray-100 px-3 py-2 rounded-lg cursor-pointer">
          {uploading ? "Uploading..." : "+ Upload Images"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
        </label>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={variantsEnabled} onChange={(e) => setVariantsEnabled(e.target.checked)} />
          <h2 className="font-semibold text-navy">Enable Variants</h2>
        </div>
        {variantsEnabled && (
          <>
            <div>
              <label className="text-sm font-medium">Label (e.g. Choose your Pack)</label>
              <input value={variantLabel} onChange={(e) => setVariantLabel(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
            </div>
            {variantOptions.map((o, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 border rounded-lg p-2">
                <input
                  placeholder="Option name"
                  value={o.name}
                  onChange={(e) => updateVariantOption(i, { name: e.target.value })}
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-[100px]"
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={o.price}
                  onChange={(e) => updateVariantOption(i, { price: parseFloat(e.target.value) || 0 })}
                  className="border rounded px-2 py-1 text-sm w-24"
                />
                <input
                  type="number"
                  placeholder="MRP"
                  value={o.compare_price ?? ""}
                  onChange={(e) => updateVariantOption(i, { compare_price: e.target.value ? parseFloat(e.target.value) : undefined })}
                  className="border rounded px-2 py-1 text-sm w-24"
                />
                <label className="flex items-center gap-1 text-xs">
                  <input type="radio" checked={!!o.default} onChange={() => setDefaultVariant(i)} /> Default
                </label>
                <button onClick={() => removeVariantOption(i)} className="text-red-500 text-sm">Remove</button>
              </div>
            ))}
            <button onClick={addVariantOption} className="text-sm text-ctatext font-medium">+ Add Option</button>
          </>
        )}
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">Trust Badges</h2>
        {trustBadges.map((b, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={b.icon}
              onChange={(e) => {
                const next = [...trustBadges];
                next[i] = { ...next[i], icon: e.target.value };
                setTrustBadges(next);
              }}
              className="w-16 border rounded-lg px-2 py-2 text-center"
            />
            <input
              value={b.text}
              onChange={(e) => {
                const next = [...trustBadges];
                next[i] = { ...next[i], text: e.target.value };
                setTrustBadges(next);
              }}
              className="flex-1 border rounded-lg px-3 py-2"
            />
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-navy">SEO</h2>
        <div>
          <label className="text-sm font-medium">Meta Title</label>
          <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
        <div>
          <label className="text-sm font-medium">Meta Description</label>
          <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} className="w-full border rounded-lg px-3 py-2 mt-1" />
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 flex items-center gap-2">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <label className="text-sm font-medium">Active (visible on storefront)</label>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-cta text-white font-semibold px-6 py-2.5 rounded-lg disabled:opacity-60"
      >
        {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
      </button>
    </div>
  );
}
