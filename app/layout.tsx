import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marshall Family Care",
  description: "Private family intake and care coordination for Marshall Funeral Home.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
