import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "500", "600", "700"],
});
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plexmono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "OmniRoute Portable Kit — one folder, any machine",
  description:
    "A drop-in portable launcher for OmniRoute: pinned Node.js LTS, local install, encrypted data folder, API-key protection on by default. No admin rights, no global Node.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${space.variable} ${plex.variable} ${plexMono.variable}`}>
      <body className="antialiased">
        <div className="site-bg" aria-hidden />
        <div className="site-grid" aria-hidden />
        {children}
      </body>
    </html>
  );
}