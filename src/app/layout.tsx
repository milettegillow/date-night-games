import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { GameProvider } from "@/context/GameContext";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Date Night Games",
  description: "Shuffle the deck. Spark the conversation.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Date Night",
  },
  openGraph: {
    title: "Date Night Games",
    description: "Shuffle the deck. Spark the conversation.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${inter.variable} antialiased`}
      >
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}
