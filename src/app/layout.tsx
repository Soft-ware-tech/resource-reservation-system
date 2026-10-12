import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PrimeWave Reserve",
  description: "Shared resource reservations, with availability at a glance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try { const t = localStorage.getItem('resource-reservation-theme'); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch {}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
