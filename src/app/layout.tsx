import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/shell/app-shell";
import "./globals.css";

// Magica sets UI type in Lineto Circular (proprietary). Plus Jakarta Sans is
// the open geometric match, with real 400/500/600/700 cuts so medium UI text
// is not silently rendered as regular.
const magica = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-magica",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: true,
});

const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Magica",
  description: "Your AI worker. Work at the speed of thought.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${magica.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-[14px] leading-5 text-[#1b1b1b]">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
