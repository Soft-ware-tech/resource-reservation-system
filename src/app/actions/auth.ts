"use server";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken } from "@/lib/auth/token";
import { prisma } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation/auth";

export type LoginState = {
  error?: string;
};

export async function signIn(
  intendedRole: Role,
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email address and password." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (
    !user ||
    !user.active ||
    user.role !== intendedRole ||
    !(await compare(parsed.data.password, user.passwordHash))
  ) {
    return { error: "We couldn't sign you in with those details." };
  }

  const token = await createSessionToken({
    sub: user.id,
    name: user.name,
    role: user.role,
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(user.role === "ADMIN" ? "/admin" : "/user");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
