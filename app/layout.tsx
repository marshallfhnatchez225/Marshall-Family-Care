import type { Metadata } from "next";
import { DeathCertificateStageHelper } from "@/components/family/death-certificate-stage-helper";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marshall Family Care Portal",
  description: "Care coordination portal for Marshall Family Care."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <DeathCertificateStageHelper />
      </body>
    </html>
  );
}
