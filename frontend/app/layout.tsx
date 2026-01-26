import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "Mono-Parser - Credit Scoring for Nigerian Fintechs",
  description:
    "Make smarter lending decisions with real-time cashflow analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${dmSans.variable} antialiased`}>
        <QueryProvider>
          {" "}
          <Toaster position="top-right" />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
