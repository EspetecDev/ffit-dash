import type { Metadata } from "next"

import "./globals.css"

export const metadata: Metadata = {
  title: "Fitness Daily Log",
  description: "CSV-backed dashboard for daily fitness tracking",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
