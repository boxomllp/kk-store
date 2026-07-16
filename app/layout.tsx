import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreSettingsProvider } from "@/lib/hooks/useStoreSettings";
import { PixelProvider } from "@/lib/hooks/usePixel";
import { FormConfigProvider } from "@/lib/hooks/useFormConfig";
import { PagesNavProvider } from "@/lib/hooks/usePagesNav";
import PageViewTracker from "@/components/PageViewTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Kleezo Shop",
  description: "Shop the best products with Cash on Delivery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {supabaseUrl && <link rel="preconnect" href={supabaseUrl} />}
        {supabaseUrl && <link rel="dns-prefetch" href={supabaseUrl} />}
      </head>
      <body>
        <StoreSettingsProvider>
          <PixelProvider>
            <FormConfigProvider>
              <PagesNavProvider>
                <PageViewTracker />
                {children}
              </PagesNavProvider>
            </FormConfigProvider>
          </PixelProvider>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}
