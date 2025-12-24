
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Attendance AI | Agent",
    description: "AI-powered attendance assistant for admins.",
};

export default async function AgentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/");
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-change-me');
        const { payload } = await jwtVerify(token, secret);

        if (payload.role !== "admin") {
            redirect("/");
        }
    } catch (error) {
        redirect("/");
    }

    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                {children}
            </body>
        </html>
    );
}
