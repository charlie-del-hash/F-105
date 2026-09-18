import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "@fontsource-variable/source-serif-4";
import "./globals.css";
import { site } from "@/config/site";
import { THEME_STORAGE_KEY, defaultTheme } from "@/design/tokens";
import { Shell } from "@/components/shell/Shell";
import { getCommandIndex } from "@/content/loader";

export const metadata: Metadata = {
  title: { default: `${site.name} ${site.product}`, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: `${site.name} ${site.product}`,
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: site.name },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0d",
};

/* Applies the persisted theme before first paint so there is no flash.
   Mirrors THEME_STORAGE_KEY in src/design/tokens.ts. */
const themeBoot = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const index = await getCommandIndex();
  return (
    <html
      lang="en"
      data-theme={defaultTheme}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} h-full`}
    >
      <body className="crt min-h-full flex flex-col">
        <Script id="theme-boot" strategy="beforeInteractive">{themeBoot}</Script>
        <Shell index={index}>{children}</Shell>
      </body>
    </html>
  );
}
