"use client"

import { useSyncExternalStore } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

export function ModeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const isDark = mounted && theme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("max-sm:size-8 max-sm:p-0", className)}
      disabled={!mounted}
      aria-label={strings.theme.toggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <span className="max-sm:hidden">
        {isDark ? strings.theme.light : strings.theme.dark}
      </span>
      <span className="sm:hidden">
        {isDark ? <SunIcon /> : <MoonIcon />}
      </span>
    </Button>
  )
}
