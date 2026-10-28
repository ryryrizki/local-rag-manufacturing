import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Precision AI Copilot",
  description: "Local manufacturing knowledge assistant",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

