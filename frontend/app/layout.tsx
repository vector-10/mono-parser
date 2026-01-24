import type { Metadata } from "next";
import {  DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: "Mono Parser",
  description: "More Reasons to say No or Yes to a Loan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${dmSans.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
