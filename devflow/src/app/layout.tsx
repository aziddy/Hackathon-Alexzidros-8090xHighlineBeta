import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevFlow - Track Your Development Workflow",
  description: "Break down issues into atomic steps and track your progress with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
