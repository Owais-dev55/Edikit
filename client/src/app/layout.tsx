import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Edikit : Create Production-Level Motion Graphics in Seconds",
  description:
    "Edikit lets you create viral, production-level motion graphics in seconds. Choose a template, customize it, and generate videos automatically.",
  // icons: {
  //   icon: [
  //     { url: "/favicon.ico" },
  //     { url: "/favicon-16x16.png", sizes: "16x16",  },
  //     { url: "/favicon-32x32.png", sizes: "32x32",  },
  //     { url: "/favicon-192x192.png", sizes: "192x192",  },
  //     {url: "/favicon-512x512.png", sizes: "512x512",  }
  //   ] , 
  // apple: '/apple-touch-icon.png',
  // }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
