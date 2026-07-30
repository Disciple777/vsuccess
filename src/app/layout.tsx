import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VSuccess — Viral Video Ideas Finder",
  description:
    "Discover viral video ideas for your niche. Find what's popping on YouTube, TikTok, and Instagram with AI-powered insights.",
  openGraph: {
    title: "VSuccess — Viral Video Ideas Finder",
    description:
      "Discover viral video ideas for your niche. Find what's popping on YouTube, TikTok, and Instagram with AI-powered insights.",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
