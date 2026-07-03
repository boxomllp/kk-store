"use client";

import { useStoreSettings } from "@/lib/hooks/useStoreSettings";

export default function AnnouncementBar() {
  const { settings } = useStoreSettings();

  if (settings.announcement_show !== "true" || !settings.announcement_text) return null;

  const content = (
    <p
      style={{ backgroundColor: settings.announcement_bg_color, color: settings.announcement_text_color }}
      className="text-center text-sm py-2 px-4"
    >
      {settings.announcement_text}
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
