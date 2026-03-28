import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { prisma } from "@/lib/db";
import { I18nProvider } from "@/lib/i18n/I18nProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

export const metadata: Metadata = {
  title: "CLV | Freebie Hunter",
  description: "Cybersecurity Airdrop & Freebie Platform",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CLV",
    statusBarStyle: "black-translucent",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let lang = "vi";
  try {
    const prefs = await prisma.userPrefs.findFirst();
    if (prefs?.language) lang = prefs.language;
  } catch (err) {
    console.error("I18n Load Error:", err);
  }

  return (
    <html lang={lang}>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[var(--bg-base)] text-[var(--text-primary)] min-h-screen overscroll-none`}>
        <I18nProvider lang={lang}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
