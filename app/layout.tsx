import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "ipop — an oversight agent for autonomous work",
  description:
    "ipop runs a Pion-style oversight hierarchy on top of your own agents: triage gates, spend guardrails, outreach-safety checks, and a verified-scheduling heartbeat — with a live feed of every decision.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#08090b] text-[#e6e8eb]">
        {children}
      </body>
    </html>
  );
}
