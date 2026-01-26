import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "ZollPilot",
  description: "ZollPilot Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

