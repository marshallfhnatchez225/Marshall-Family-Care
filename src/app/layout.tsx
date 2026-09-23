import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });
export const metadata: Metadata = {
 title: "Marshall OS",
 description: "Marshall Funeral Home operations command center",
 applicationName: "Marshall OS",
 manifest: "/manifest.webmanifest",
 icons: {
  icon: [{url:"/icon-192.png",sizes:"192x192",type:"image/png"},{url:"/icon-512.png",sizes:"512x512",type:"image/png"}],
  apple: [{url:"/apple-touch-icon.png",sizes:"180x180",type:"image/png"}],
 },
 appleWebApp: {capable:true,title:"Marshall OS",statusBarStyle:"black-translucent"},
};
export const viewport: Viewport = {themeColor:"#751d37"};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className={`${geist.variable} ${mono.variable}`}><body>{children}</body></html>; }
