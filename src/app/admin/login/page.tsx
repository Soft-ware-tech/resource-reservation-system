import type { Metadata } from "next";
import { LoginCard } from "@/components/login-card";

export const metadata: Metadata = { title: "Admin login | PrimeWave Reserve" };

export default function AdminLoginPage() {
  return <LoginCard role="ADMIN" />;
}
