"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { PageRow } from "@/lib/types";

type Ctx = {
  headerPages: PageRow[];
  footerPages: PageRow[];
};

const PagesNavContext = createContext<Ctx>({ headerPages: [], footerPages: [] });

export function PagesNavProvider({ children }: { children: ReactNode }) {
  const [pages, setPages] = useState<PageRow[]>([]);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase
      .from("pages")
      .select("*")
      .or("show_in_header.eq.true,show_in_footer.eq.true")
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setPages(data as PageRow[]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <PagesNavContext.Provider
      value={{
        headerPages: pages.filter((p) => p.show_in_header),
        footerPages: pages.filter((p) => p.show_in_footer),
      }}
    >
      {children}
    </PagesNavContext.Provider>
  );
}

export function usePagesNav() {
  return useContext(PagesNavContext);
}
