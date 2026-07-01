import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  metadataBase: new URL("https://bingo-psi-flame.vercel.app"),
  title: "VIVE 37 Nahual — BINGO",
  description:
    "Sistema de venta y distribución de cartones BINGO VIVE 37 Nahual",
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "VIVE 37 Nahual — BINGO",
    description:
      "Sistema de venta y distribución de cartones BINGO virtual y presencial",
    url: "https://bingo-psi-flame.vercel.app",
    siteName: "VIVE 37 Nahual",
    images: [
      {
        url: "/og-image.png",
        width: 1024,
        height: 1024,
        alt: "Equipo Nahual — VIVE 37 BINGO",
      },
    ],
    locale: "es_CR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIVE 37 Nahual — BINGO",
    description:
      "Sistema de venta y distribución de cartones BINGO virtual y presencial",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
