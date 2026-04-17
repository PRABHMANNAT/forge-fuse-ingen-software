import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const themeScript = `
(function() {
  try {
    var key = "ingen-theme";
    var pref = window.localStorage.getItem(key) || "system";
    if (["system", "light", "dark"].indexOf(pref) === -1) pref = "system";
    var resolved = pref === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : pref;
    var root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themePreference = pref;
    root.classList.toggle("dark", resolved === "dark");
  } catch (error) {
    var fallback = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = fallback;
    document.documentElement.dataset.themePreference = "system";
    document.documentElement.classList.toggle("dark", fallback === "dark");
  }
})();
`

export const metadata: Metadata = {
  title: "FORGE — Proof-first hiring",
  description: "Rank candidates with auditable evidence in under 60 seconds.",
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
