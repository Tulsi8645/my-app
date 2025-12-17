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
  title: "Tecobit Technology Pvt. Ltd.",
  description: "Attendance Management System",
  manifest: "/manifest.json",
};

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-me');
      const { payload } = await jwtVerify(token, secret);

      if (payload.role === 'admin') {
        redirect("/admin");
      }
    } catch (error) {
      // Ignore invalid tokens
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
