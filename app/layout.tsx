import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

import { siteConfig } from "@/lib/site";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap"
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  applicationName: siteConfig.name
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${plusJakartaSans.variable} ${fraunces.variable}`} lang="en">
      <body>{children}</body>
    </html>
  );
}
