import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { metadataBaseUrl } from "@/lib/siteUrl";

// The handoff specifies DM Sans 400/500/700 — the same family the mobile app
// uses, so web and app read as one product.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// Relative canonical/openGraph URLs need an absolute base to resolve against.
// lib/siteUrl.js picks it: NEXT_PUBLIC_SITE_URL in production, the Vercel
// preview URL on previews, localhost otherwise.
export const metadata = {
  metadataBase: new URL(metadataBaseUrl()),
  applicationName: "Keplix Partner",
  title: "Keplix Partner — Vendor Portal",
  description:
    "Manage bookings, walk-ins, your service catalog and earnings for your Keplix workshop.",
  // Default to noindex and let only the three public pages (/welcome, /sign-in,
  // /sign-up) opt back in via their own layouts. Almost every route here is a
  // signed-in vendor's own workshop data, and the portal and onboarding layouts
  // are `'use client'` (their pages import hooks from them), so they cannot
  // export metadata themselves. Denying by default also means a route added
  // later is private unless someone deliberately publishes it.
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  // en-IN: the portal is an India-only product (INR, Indian addresses and
  // phone number formats), so the regional tag is the accurate one.
  return (
    <html lang="en-IN" className={`${dmSans.variable} h-full`}>
      <body
        className="min-h-full"
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
