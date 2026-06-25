import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/store";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fitness Factory KC — Coaching Platform",
  description:
    "Private coaching platform for Fitness Factory KC — workouts, nutrition, progress tracking, recovery and messaging for coaches and members.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Apply the saved theme before first paint to avoid a flash of the wrong theme.
  const themeInit = `try{var t=localStorage.getItem('ffkc-theme');document.documentElement.dataset.theme=(t==='trainerize'||t==='midnight')?t:'midnight';}catch(e){document.documentElement.dataset.theme='midnight';}`;
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
