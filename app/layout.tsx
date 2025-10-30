import type { Metadata } from "next";
import { Poppins, Bebas_Neue } from "next/font/google";
import "./globals.css";
import HeaderBar from "./components/HeaderBar";

const poppins = Poppins({
  variable: "--font-sans",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-display",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SoundMatch AI",
  description: "Descubrí música nueva basada en lo que te gusta",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // small client check to ensure session refresh via middleware
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${bebas.variable} antialiased`}
      >
        <HeaderBar />
        {children}
      </body>
    </html>
  );
}
