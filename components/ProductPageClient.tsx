"use client";

import { useEffect, useRef, useState } from "react";
import { usePixel } from "@/lib/hooks/usePixel";
import type { Product, VariantOption } from "@/lib/types";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnnouncementBar from "@/components/AnnouncementBar";
import DeliveryTimeline from "@/components/DeliveryTimeline";
import TrustBadges from "@/components/TrustBadges";
import BuyNowPopup from "@/components/BuyNowPopup";

export default function ProductPageClient({ product }: { product: Product }) {
  const { track } = usePixel();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<VariantOption | null>(() => {
    if (product.variants?.enabled) {
      return product.variants.options.find((o) => o.default) || product.variants.options[0] || null;
    }
    return null;
  });
  const [showSticky, setShowSticky] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "ingredients" | "how_to_use" | "faqs">(
    "description"
  );
  const buyBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("ViewContent", { value: product.price, currency: "INR", content_name: product.name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Sticky bar: appears INSTANTLY via scroll listener + getBoundingClientRect
  useEffect(() => {
    function onScroll() {
      if (!buyBtnRef.current) return;
      const rect = buyBtnRef.current.getBoundingClientRect();
      setShowSticky(rect.bottom < 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const price = selectedVariant ? selectedVariant.price : product.price;
  const comparePrice = selectedVariant ? selectedVariant.compare_price : product.compare_price;
  const discount = comparePrice && comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;
  const bullets = (product.short_description || "").split("\n").filter(Boolean);

  return (
    <>
      <AnnouncementBar />
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6 grid sm:grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
            {product.images?.[activeImage] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : null}
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                    activeImage === i ? "border-cta" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-2xl font-bold text-navy">{product.name}</h1>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-extrabold text-navy">₹{price}</span>
            {comparePrice && comparePrice > price && (
              <>
                <span className="text-gray-400 line-through text-lg">₹{comparePrice}</span>
                <span className="text-green-600 font-semibold text-sm">{discount}% OFF</span>
              </>
            )}
          </div>

          {bullets.length > 0 && (
            <ul className="mt-4 space-y-1">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="text-cta font-bold">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {product.variants?.enabled && product.variants.options.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium mb-2">{product.variants.label || "Choose your Pack"}</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.options.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => setSelectedVariant(opt)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium ${
                      selectedVariant?.name === opt.name
                        ? "bg-black text-white border-black"
                        : "bg-white text-navy border-gray-300"
                    }`}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={buyBtnRef} className="mt-6">
            <button
              onClick={() => setShowPopup(true)}
              className="btn-pulse w-full bg-cta text-white rounded-full"
              style={{ padding: "20px 40px", fontSize: 22, fontWeight: 800 }}
            >
              Buy It Now
            </button>
          </div>

          <div className="mt-6">
            <DeliveryTimeline />
          </div>

          <div className="mt-6">
            <TrustBadges />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 border-b overflow-x-auto">
          {[
            { key: "description", label: "Description" },
            { key: "ingredients", label: "Ingredients" },
            { key: "how_to_use", label: "How to Use" },
            { key: "faqs", label: "FAQs" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`pb-3 px-1 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === t.key ? "border-cta text-cta" : "border-transparent text-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === "description" && (
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: product.description_html || "" }} />
          )}
          {activeTab === "ingredients" && (
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: product.ingredients_html || "" }} />
          )}
          {activeTab === "how_to_use" && (
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: product.how_to_use_html || "" }} />
          )}
          {activeTab === "faqs" && (
            <div className="space-y-2">
              {(product.faqs || []).map((f, i) => (
                <FaqItem key={i} question={f.question} answer={f.answer} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      {showSticky && !showPopup && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.1)] z-30 flex items-center justify-between px-4"
          style={{ minHeight: 64 }}
        >
          <button
            onClick={() => setShowPopup(true)}
            className="btn-pulse bg-cta text-white font-bold px-6 py-2.5 rounded-full text-sm"
          >
            Buy It Now
          </button>
          <div className="text-right">
            <p className="text-sm font-medium truncate max-w-[140px]">{product.name}</p>
            <p className="font-bold text-navy">₹{price}</p>
          </div>
        </div>
      )}

      {showPopup && (
        <BuyNowPopup
          productId={product.id}
          productName={product.name}
          price={price}
          variant={selectedVariant?.name || null}
          onClose={() => setShowPopup(false)}
        />
      )}

      <Footer />
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-medium text-sm"
      >
        {question}
        <span className={`transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="px-4 pb-3 text-sm text-gray-600">{answer}</div>}
    </div>
  );
}
