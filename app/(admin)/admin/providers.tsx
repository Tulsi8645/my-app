"use client";

import { SidebarProvider } from "@admin/components/Layouts/sidebar/sidebar-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>{children}</SidebarProvider>
  );
}
