import type { Metadata } from "next";

import { LocaleProvider } from "@/lib/i18n/client";
import { getLocaleContext } from "@/lib/i18n/server";
import { getSiteConfig } from "@/lib/site";
import "./globals.css";

const siteConfig = getSiteConfig();

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  applicationName: siteConfig.name
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getLocaleContext();

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale} messages={messages}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
