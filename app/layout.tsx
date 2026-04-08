import type { Metadata } from "next";
import { Geist, Geist_Mono, Cormorant, Jost } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://climara.app";

export const metadata: Metadata = {
  title: "Climara — Weather & Local Time Around the World",
  description:
    "See the weather and local time for your favorite cities at a glance. Add up to three cities and watch them side by side in real time.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Climara",
    description: "Real-time weather and local time for cities around the world.",
    url: BASE_URL,
    siteName: "Climara",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Climara — Weather & Local Time Around the World",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Climara",
    description: "Real-time weather and local time for cities around the world.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-8KGWTR3N9N"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-8KGWTR3N9N');
        `}
      </Script>
    </html>
  );
}
