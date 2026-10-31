import type { Metadata, Viewport } from "next";
import "./globals.css";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { PanierProvider } from "@/components/panier-provider";
import { modeDemo, boutiqueDuVendeur } from "@/lib/store";
import { utilisateurCourant } from "@/lib/session";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "BWAKA — Le commerce en ligne, enfin pensé pour la RDC",
    template: "%s · BWAKA",
  },
  description:
    "BWAKA réunit vendeurs, acheteurs et livreurs sur une seule application : catalogue, paiement mobile money, séquestre intelligent, livraison suivie et avis vérifiés.",
  keywords: ["BWAKA", "e-commerce RDC", "marketplace Congo", "mobile money", "Goma", "livraison"],
  authors: [{ name: "LK-TECH / LinkSmartec Sarl" }],
  openGraph: {
    title: "BWAKA — la marketplace de confiance de la RDC",
    description: "Vendre, payer en mobile money, livrer et être payé en toute confiance.",
    locale: "fr_CD",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b2b4b",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await utilisateurCourant();
  const vendeur = user ? Boolean(await boutiqueDuVendeur(user.id)) : false;

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col">
        <PanierProvider>
          <Header user={user} demo={modeDemo} vendeur={vendeur} />
          <main className="flex-1">{children}</main>
          <Footer />
        </PanierProvider>
      </body>
    </html>
  );
}
