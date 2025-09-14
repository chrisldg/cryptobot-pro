import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RiskDisclaimer from "@/app/components/RiskDisclaimer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CryptoBot Pro - Trading Automatisé (DÉMO)",
  description: "Plateforme de trading crypto automatisée - MODE DÉMO UNIQUEMENT. Aucun trading réel. Risque de perte en capital.",
  keywords: "crypto bot demo, trading simulation, test trading",
  robots: "noindex, nofollow", // Empêche l'indexation Google tant qu'on est en test
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <RiskDisclaimer />
        {children}
      </body>
    </html>
  );
}