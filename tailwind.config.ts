import type { Config } from "tailwindcss"

const light = {
  bg: "#f4f4f4",
  surface: "#ffffff",
  "surface-elevated": "#ffffff",
  border: "rgba(22, 22, 22, 0.12)",
  "border-strong": "rgba(22, 22, 22, 0.24)",
  text: "#161616",
  "text-muted": "#525252",
  "text-subtle": "#6f6f6f",
  accent: "#0f62fe",
  "accent-muted": "rgba(15, 98, 254, 0.1)",
  success: "#198038",
  warning: "#8a6a00",
  danger: "#da1e28",
  info: "#0f62fe",
  "success-soft": "rgba(25, 128, 56, 0.12)",
  "warning-soft": "rgba(138, 106, 0, 0.14)",
  "danger-soft": "rgba(218, 30, 40, 0.1)",
  "info-soft": "rgba(15, 98, 254, 0.1)",
}

const dark = {
  bg: "#030303",
  surface: "#080808",
  "surface-elevated": "#121212",
  border: "rgba(255, 255, 255, 0.1)",
  "border-strong": "rgba(255, 255, 255, 0.2)",
  text: "#f4f4f4",
  "text-muted": "#a8a8a8",
  "text-subtle": "#6f6f6f",
  accent: "#ff6b00",
  "accent-muted": "rgba(255, 107, 0, 0.14)",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#60a5fa",
  "success-soft": "rgba(16, 185, 129, 0.18)",
  "warning-soft": "rgba(245, 158, 11, 0.2)",
  "danger-soft": "rgba(239, 68, 68, 0.18)",
  "info-soft": "rgba(96, 165, 250, 0.18)",
}

const config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: Object.fromEntries(
        Object.keys(light).map((key) => [
          key,
          {
            DEFAULT: `var(--${key})`,
            light: light[key as keyof typeof light],
            dark: dark[key as keyof typeof dark],
          },
        ]),
      ),
    },
  },
} satisfies Config

export default config
