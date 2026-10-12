import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { InvalidSessionError, SESSION_COOKIE, verifySessionToken } from "@/lib/auth/token";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let claims;
  try {
    claims = await verifySessionToken(token);
  } catch (error) {
    if (error instanceof InvalidSessionError) return null;
    throw error;
  }

  return prisma.user.findFirst({
    where: { id: claims.sub, active: true, role: claims.role },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function requireRole(role: Role) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(role === "ADMIN" ? "/admin/login" : "/user/login");
  }
  if (user.role !== role) {
    redirect(user.role === "ADMIN" ? "/admin" : "/user");
  }
  return user;
}
