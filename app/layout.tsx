import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreSettingsProvider } from "@/lib/hooks/useStoreSettings";
import { PixelProvider } from "@/lib/hooks/usePixel";
import PageViewTracker from "@/components/PageViewTracker";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KK Store",
  description: "Shop the best products with Cash on Delivery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <StoreSettingsProvider>
          <PixelProvider>
            <PageViewTracker />
            {children}
          </PixelProvider>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}
