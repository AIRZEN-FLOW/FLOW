import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

// Montserrat : police unique de la marque AIR ZEN (voir 04-design-system.md)
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "AIR ZEN Flow",
  description:
    "L'application qui vous aide à décider quoi faire et quand, en croisant urgence, énergie, temps disponible et durée.",
};

export const viewport: Viewport = {
  themeColor: "#596D85", // Gris-bleu foncé de la charte (couleur de thème PWA)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
