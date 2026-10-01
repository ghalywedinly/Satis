import type { Metadata } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Satis — Satisfaction, measured.",
  description: "Collect feedback across your app, POS and website. See how customers feel, store by store, and fix what matters first.",
};

// For Arabic routes render <html lang="ar" dir="rtl">.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
