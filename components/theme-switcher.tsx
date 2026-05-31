"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const colorThemes = [
  { name: "Default", value: "default" },
  { name: "WhatsApp Green", value: "whatsapp" },
  { name: "Midnight", value: "midnight" },
  { name: "Ocean", value: "ocean" },
  { name: "Purple", value: "purple" },
  { name: "Enterprise", value: "enterprise" },
]

export function ThemeSwitcher() {
  const { setTheme, theme } = useTheme()
  const [colorTheme, setColorTheme] = React.useState("default")

  React.useEffect(() => {
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
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="w-4 h-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="w-4 h-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Palette className="w-4 h-4 mr-2" />
          System
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
          Color Theme
        </div>
        {colorThemes.map((ct) => (
          <DropdownMenuItem
            key={ct.value}
            onClick={() => handleColorThemeChange(ct.value)}
            className={colorTheme === ct.value ? "bg-accent" : ""}
          >
            <div
              className={`mr-2 h-4 w-4 rounded-full ${
                ct.value === "default"
                  ? "bg-gray-500"
                  : ct.value === "whatsapp"
                  ? "bg-green-500"
                  : ct.value === "midnight"
                  ? "bg-blue-900"
                  : ct.value === "ocean"
                  ? "bg-cyan-500"
                  : ct.value === "purple"
                  ? "bg-purple-500"
                  : "bg-slate-700"
              }`}
            />
            {ct.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function applyColorTheme(colorTheme: string) {
  const root = document.documentElement
  root.classList.remove(
    "theme-default",
    "theme-whatsapp",
    "theme-midnight",
    "theme-ocean",
    "theme-purple",
    "theme-enterprise"
  )
  root.classList.add(`theme-${colorTheme}`)
}