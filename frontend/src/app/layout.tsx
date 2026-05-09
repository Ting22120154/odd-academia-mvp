import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { SidebarWrapper } from "@/components/SidebarWrapper";
import { GuestBanner } from "@/components/GuestBanner";
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
        <AuthProvider>
          <div className="flex min-h-screen bg-[var(--background)]">
            <SidebarWrapper />
            <div className="flex min-w-0 flex-1 flex-col">
              <GuestBanner />
              <main className="flex-1 px-6 py-6">{children}</main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
