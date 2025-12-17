
import "@admin/css/style.css";

import { Sidebar } from "@admin/components/Layouts/sidebar";

import "flatpickr/dist/flatpickr.min.css";


import { Header } from "@admin/components/Layouts/header";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Admin dashboard",
    default: "Admin dashboard",
  },
  description:
    "Admin dashboard for attendance management.",
};

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

export default async function RootLayout({ children }: PropsWithChildren) {
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
  } catch (err) {
    redirect("/");
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          <div className="flex min-h-screen">
            <Sidebar />

            <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
              <Header />

              <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
