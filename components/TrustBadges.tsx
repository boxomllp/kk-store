"use client";

import { useStoreSettings } from "@/lib/hooks/useStoreSettings";

export default function TrustBadges() {
  const { settings } = useStoreSettings();
  if (settings.trust_badges_show !== "true") return null;

  const badges = [1, 2, 3]
    .map((n) => {
      try {
        return JSON.parse(settings[`trust_badge_${n}`] || "{}");
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return (
    <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex flex-col sm:flex-row items-center gap-4 justify-between">
      <div className="flex items-center gap-2 font-semibold text-green-800">
        <span>🛡️</span>
        <span>Trusted Business</span>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {badges.map((b, i) => (
          <div key={i} className="flex items-center gap-1 text-sm text-green-800">
            <span>{b.emoji}</span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
