"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const nextIsDark = storedTheme ? storedTheme === "dark" : prefersDark

    document.documentElement.classList.toggle("dark", nextIsDark)
    const frame = window.requestAnimationFrame(() => setIsDark(nextIsDark))

    return () => window.cancelAnimationFrame(frame)
  }, [])

  function toggleTheme() {
    const nextIsDark = !isDark
    document.documentElement.classList.toggle("dark", nextIsDark)
    window.localStorage.setItem("theme", nextIsDark ? "dark" : "light")
    setIsDark(nextIsDark)
  }

  return (
    <Button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? "Light theme" : "Dark theme"}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
