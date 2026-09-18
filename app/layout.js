import { DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// The handoff specifies DM Sans 400/500/700 — the same family the mobile app
// uses, so web and app read as one product.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "Keplix Partner — Vendor Portal",
  description:
    "Manage bookings, walk-ins, your service catalog and earnings for your Keplix workshop.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body
        className="min-h-full"
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
