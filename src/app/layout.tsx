/**
 * Development-only root layout.
 *
 * DELETE THIS FILE during integration into the main site — the host app
 * provides its own root layout with <html>, <body>, fonts, header/footer.
 * The TestTaker UI is wrapped by src/app/tests/layout.tsx instead.
 */
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TestTaker",
  description: "Practice tests for GED, ACT, SAT, AP exams and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
