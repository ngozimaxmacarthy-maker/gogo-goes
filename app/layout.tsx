import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gogo Goes",
  description: "Group travel for the road less traveled.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
