import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import Logo from "@/components/Logo";
import GrainOverlay from "@/components/GrainOverlay";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SUPERSELF",
  description: "Electronic music label & creative brand",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistMono.variable} antialiased bg-black`}>
        <Logo />
        <Navigation />
        <GrainOverlay />
        {children}
      </body>
    </html>
  );
}
