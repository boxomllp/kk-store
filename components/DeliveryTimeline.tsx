"use client";

import { useStoreSettings } from "@/lib/hooks/useStoreSettings";

function addDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DeliveryTimeline({ compact = false }: { compact?: boolean }) {
  const { settings } = useStoreSettings();
  const readyDays = parseInt(settings.order_ready_days || "1", 10);
  const deliveryDays = parseInt(settings.delivery_days || "4", 10);

  const steps = [
    { icon: "🛒", label: "Ordered", date: addDays(0) },
    { icon: "📦", label: "Order Ready", date: addDays(readyDays) },
    { icon: "🚚", label: "Delivered", date: addDays(deliveryDays) },
  ];

  return (
    <div className={`flex items-center justify-between ${compact ? "gap-2" : "gap-4"}`}>
      {steps.map((s, i) => (
        <div key={s.label} className="flex-1 flex items-center">
          <div className="flex flex-col items-center text-center flex-1">
            <div
              className={`rounded-full bg-orange-100 flex items-center justify-center ${
                compact ? "w-8 h-8 text-base" : "w-12 h-12 text-xl"
              }`}
            >
              {s.icon}
            </div>
            <span className={`mt-1 font-medium ${compact ? "text-xs" : "text-sm"}`}>{s.label}</span>
            <span className="text-xs text-gray-500">{s.date}</span>
          </div>
          {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-orange-200 -mt-6" />}
        </div>
      ))}
    </div>
  );
}
