import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";

export const SESSION_COOKIE = "resource_reservation_session";
export const SESSION_MAX_AGE = 60 * 60 * 8;

export type SessionClaims = {
  sub: string;
  name: string;
  role: Role;
};

export class InvalidSessionError extends Error {
  constructor() {
    super("The session token is invalid or expired.");
    this.name = "InvalidSessionError";
  }
}

function signingKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to a value of at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionClaims) {
  return new SignJWT({ name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(signingKey());
}

export async function verifySessionToken(token: string) {
  const key = signingKey();
  let payload;
  try {
    ({ payload } = await jwtVerify(token, key, { algorithms: ["HS256"] }));
  } catch {
    throw new InvalidSessionError();
  }

  if (
    typeof payload.sub !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "ADMIN" && payload.role !== "USER")
  ) {
    throw new InvalidSessionError();
  }

  return {
    sub: payload.sub,
    name: payload.name,
    role: payload.role as Role,
  };
}
