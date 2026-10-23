"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export function ModeToggle() {
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
      disabled={!mounted}
      aria-label={strings.theme.toggle}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? strings.theme.light : strings.theme.dark}
    </Button>
  )
}
