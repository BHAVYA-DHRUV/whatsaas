"use client"

import * as React from "react"
import { Moon, Sun, Palette, Check } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

const colorThemes = [
  { name: "Default", value: "default", color: "bg-gray-500" },
  { name: "WhatsApp Green", value: "whatsapp", color: "bg-green-500" },
  { name: "Midnight Blue", value: "midnight", color: "bg-blue-900" },
  { name: "Ocean", value: "ocean", color: "bg-cyan-500" },
  { name: "Purple", value: "purple", color: "bg-purple-500" },
  { name: "Enterprise", value: "enterprise", color: "bg-slate-700" },
]

const ALL_THEME_CLASSES = colorThemes.map((t) => `theme-${t.value}`)

function applyColorTheme(value: string) {
  if (typeof window === 'undefined') return
  const root = document.documentElement
  root.classList.remove(...ALL_THEME_CLASSES)
  root.classList.add(`theme-${value}`)
  // Dispatch custom event so ColorThemeHandler can react
  window.dispatchEvent(new CustomEvent('color-theme-change', { detail: value }))
}

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()
  const [colorTheme, setColorTheme] = React.useState("default")

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem("color-theme") || "default"
    setColorTheme(saved)
    applyColorTheme(saved)
  }, [])

  const handleColorThemeChange = (value: string) => {
    setColorTheme(value)
    localStorage.setItem("color-theme", value)
    applyColorTheme(value)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Toggle theme">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Appearance
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="w-4 h-4 mr-2" />
          Light
          {theme === "light" && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="w-4 h-4 mr-2" />
          Dark
          {theme === "dark" && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Palette className="w-4 h-4 mr-2" />
          System
          {theme === "system" && <Check className="w-4 h-4 ml-auto" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Color Theme
        </DropdownMenuLabel>
        {colorThemes.map((ct) => (
          <DropdownMenuItem
            key={ct.value}
            onClick={() => handleColorThemeChange(ct.value)}
            className="cursor-pointer"
          >
            <div className={`mr-2 h-4 w-4 rounded-full ${ct.color} shrink-0`} />
            {ct.name}
            {colorTheme === ct.value && <Check className="w-4 h-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}