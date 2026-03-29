import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ET Finance Mentor — AI-Powered Personal Finance for India",
  description:
    "Turn confused savers into confident investors. AI builds your complete financial roadmap — FIRE planning, tax optimization, portfolio X-ray, and more.",
  keywords: [
    "personal finance India",
    "FIRE planning",
    "tax wizard",
    "mutual fund analysis",
    "AI financial advisor",
    "money health score",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-white font-sans">
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  );
}
