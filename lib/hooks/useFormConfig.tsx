"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { FormField } from "@/lib/types";

type Ctx = {
  fields: FormField[];
  loading: boolean;
};

const FormConfigContext = createContext<Ctx>({ fields: [], loading: true });

export function FormConfigProvider({ children }: { children: ReactNode }) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    supabase
      .from("form_config")
      .select("*")
      .eq("visible", true)
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setFields(data as FormField[]);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return <FormConfigContext.Provider value={{ fields, loading }}>{children}</FormConfigContext.Provider>;
}

export function useFormConfig() {
  return useContext(FormConfigContext);
}
