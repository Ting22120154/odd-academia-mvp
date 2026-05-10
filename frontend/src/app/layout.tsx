import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Odd Academia MVP",
  description: "Odd Academia Platform Development (MVP)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased light`}
    >
      <body className="min-h-full font-sans text-[var(--foreground)]">
        <div className="min-h-screen bg-[var(--background)]">
          <TopNav isLoggedIn />
          <main className="mx-auto w-full max-w-[var(--page-max)] px-6 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
