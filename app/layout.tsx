import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThinkDrop",
  description: "Capture your thoughts instantly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen antialiased">
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
