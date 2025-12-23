import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Providers from "@/redux/Provider";

const neueHaasGrotesk = localFont({
  src: [
    {
      path: "../../public/fonts/NEUEHAASGROTESKTEXT.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/NEUEHAASGROTESKTEXTMEDIUM.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-neue-haas-grotesk",
  display: "swap",
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
        className={`${neueHaasGrotesk.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers  >
        <Navbar />
        {children}
        </Providers>
         
      </body>
    </html>
  );
}
