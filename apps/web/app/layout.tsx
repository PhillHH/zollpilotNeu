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
  console.log("!!! RENDERING ROOT LAYOUT !!!");
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

