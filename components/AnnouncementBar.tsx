"use client";

import { useStoreSettings } from "@/lib/hooks/useStoreSettings";

export default function AnnouncementBar() {
  const { settings } = useStoreSettings();

  if (settings.announcement_show !== "true" || !settings.announcement_text) return null;

  const content = (
    <p
      style={{ backgroundColor: settings.announcement_bg_color, color: settings.announcement_text_color }}
      className="text-center text-sm sm:text-base font-bold py-2.5 px-4 flex items-center justify-center gap-2"
    >
      <span>🛍️</span>
      <span>⭐</span>
      <span>{settings.announcement_text}</span>
    </p>
  );

  if (settings.announcement_link) {
    return (
      <a href={settings.announcement_link} className="block">
        {content}
      </a>
    );
  }

  return content;
}
