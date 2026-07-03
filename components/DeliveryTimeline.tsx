"use client";

import { useStoreSettings } from "@/lib/hooks/useStoreSettings";

function formatDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function DeliveryTimeline({ compact = false }: { compact?: boolean }) {
  const { settings } = useStoreSettings();
  const readyDays = parseInt(settings.order_ready_days || "1", 10);
  const deliveryDays = parseInt(settings.delivery_days || "4", 10);

  const steps = [
    { icon: "🛒", label: "Ordered", date: formatDate(0) },
    { icon: "📦", label: "Order Ready", date: formatDate(readyDays) },
    { icon: "🚚", label: "Delivered", date: formatDate(deliveryDays) },
  ];

  const circleSize = compact ? 36 : 48;

  return (
    <div className={`rounded-xl bg-orange-50 ${compact ? "px-3 py-3" : "px-4 py-5"}`}>
      <div className="flex items-start">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center text-center" style={{ width: circleSize + 20 }}>
              <div
                className="rounded-full bg-navy text-white flex items-center justify-center shrink-0"
                style={{ width: circleSize, height: circleSize, fontSize: compact ? 16 : 20 }}
              >
                {s.icon}
              </div>
              <span className={`mt-1.5 font-semibold text-navy ${compact ? "text-xs" : "text-sm"}`}>
                {s.label}
              </span>
              <span className={`text-gray-500 ${compact ? "text-[11px]" : "text-xs"}`}>{s.date}</span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 bg-orange-200"
                style={{ height: 2, marginBottom: compact ? 28 : 36 }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
