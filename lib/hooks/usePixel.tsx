"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Pixel } from "@/lib/types";

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

type EventName = "PageView" | "ViewContent" | "AddToCart" | "InitiateCheckout" | "Purchase";
type EventKey = "pageView" | "viewContent" | "addToCart" | "initiateCheckout" | "purchase";

const EVENT_TO_KEY: Record<EventName, EventKey> = {
  PageView: "pageView",
  ViewContent: "viewContent",
  AddToCart: "addToCart",
  InitiateCheckout: "initiateCheckout",
  Purchase: "purchase",
};

type Ctx = {
  track: (event: EventName, params?: Record<string, any>) => void;
};

const PixelContext = createContext<Ctx>({ track: () => {} });

function injectFbqScript() {
  if (typeof window === "undefined" || window.fbq) return;
  const script = document.createElement("script");
  script.innerHTML = `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');`;
  document.head.appendChild(script);
}

export function PixelProvider({ children }: { children: ReactNode }) {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    injectFbqScript();

    const supabase = createClient();
    supabase
      .from("pixels")
      .select("*")
      .eq("active", true)
      .then(({ data, error }) => {
        if (error || !data) return;
        setPixels(data as Pixel[]);
        data.forEach((p: Pixel) => {
          if (!p.test_mode && typeof window !== "undefined" && window.fbq) {
            window.fbq("init", p.pixel_id);
          }
        });
      });
  }, []);

  const track = (event: EventName, params?: Record<string, any>) => {
    const key = EVENT_TO_KEY[event];
    pixels.forEach((p) => {
      if (!p.events?.[key]) return;
      if (p.test_mode) {
        console.log(`[FB Pixel TEST] ${event}`, { pixel_id: p.pixel_id, ...params });
        return;
      }
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("trackSingle", p.pixel_id, event, params);
      }
    });
  };

  return <PixelContext.Provider value={{ track }}>{children}</PixelContext.Provider>;
}

export function usePixel() {
  return useContext(PixelContext);
}
