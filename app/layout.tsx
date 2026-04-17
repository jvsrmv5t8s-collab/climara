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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://somewher.co";

export const metadata: Metadata = {
  title: "Somewher",
  icons: {
    icon: "/Somewher_MacOS.png",
    apple: "/Somewher_MacOS.png",
  },
  description:
    "Always know the time and weather for the people you care about. Add the people closest to you and see their city's weather and local time, side by side in real time.",
  metadataBase: new URL(BASE_URL),
  openGraph: {
    title: "Somewher",
    description: "Always know the time and weather for the people you care about.",
    url: BASE_URL,
    siteName: "Somewher",
    images: [
      {
        url: "/OG_Image_Somewher.png",
        width: 1200,
        height: 630,
        alt: "Somewher — Always know the time and weather for the people you care about",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Somewher",
    description: "Always know the time and weather for the people you care about.",
    images: ["/OG_Image_Somewher.png"],
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
