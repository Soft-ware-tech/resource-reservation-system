import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireRole } from "@/lib/auth/server";

export const instant = false;

export default async function UserLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("USER");
  return <DashboardShell name={user.name} role={user.role}>{children}</DashboardShell>;
}
