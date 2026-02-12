import type { Metadata } from "next";
import { VT323 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const vt323 = VT323({
  weight: "400",
  variable: "--font-terminal",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://superself.online'),
  title: "superself — electronic music label",
  description: "Electronic music label & creative brand. Lima, Peru.",
  openGraph: {
    title: "superself — electronic music label",
    description: "Electronic music label & creative brand. Lima, Peru.",
    url: "https://superself.online",
    siteName: "superself",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "superself — electronic music label",
    description: "Electronic music label & creative brand. Lima, Peru.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

const themeScript = `var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t;`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${vt323.variable} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
