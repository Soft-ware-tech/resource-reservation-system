"use client";

import { useActionState } from "react";
import type { Role } from "@prisma/client";
import { signIn, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

export function LoginForm({ role }: { role: Role }) {
  const action = signIn.bind(null, role);
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="login-form">
      <label htmlFor="email">Email address</label>
      <input
        autoComplete="username"
        id="email"
        name="email"
        placeholder={role === "ADMIN" ? "admin@demo.com" : "you@company.com"}
        required
        type="email"
      />
      <label htmlFor="password">Password</label>
      <input
        autoComplete="current-password"
        id="password"
        name="password"
        placeholder="Enter your password"
        required
        type="password"
      />
      {state.error && <p className="form-error" role="alert">{state.error}</p>}
      <button className="gradient-button login-submit" disabled={isPending} type="submit">
        {isPending ? "Signing in…" : `Sign in as ${role === "ADMIN" ? "admin" : "user"}`}
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
