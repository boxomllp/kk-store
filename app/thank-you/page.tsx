"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DeliveryTimeline from "@/components/DeliveryTimeline";

function ThankYouContent() {
  const params = useSearchParams();
  const order = params.get("order") || "";
  const product = params.get("product") || "";
  const variant = params.get("variant") || "";
  const price = params.get("price") || "";
  const address = params.get("address") || "";

  return (
    <>
      <Header />
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-5xl mb-2">🎉</p>
        <h1 className="text-2xl font-bold text-navy">Order Confirmed!</h1>
        <p className="text-gray-500 mt-2">Your order has been placed successfully</p>

        <div className="mt-6 rounded-xl border bg-gray-50 p-5 text-left space-y-2">
          <p className="text-sm text-gray-500">Order Number</p>
          <p className="font-bold text-lg text-cta">#{order}</p>

          <div className="border-t pt-3 mt-3">
            <p className="font-medium">{product}</p>
            {variant && <p className="text-sm text-gray-500">{variant}</p>}
            {price && <p className="font-bold text-navy">₹{price}</p>}
          </div>

          {address && (
            <div className="border-t pt-3 mt-3">
              <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
              <p className="text-sm">{address}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <DeliveryTimeline />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}
