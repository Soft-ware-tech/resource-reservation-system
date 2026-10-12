import type { Metadata } from "next";
import { LoginCard } from "@/components/login-card";

export const metadata: Metadata = { title: "User login | PrimeWave Reserve" };

export default function UserLoginPage() {
  return <LoginCard role="USER" />;
}
