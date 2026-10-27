"use client"

import { ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { strings } from "@/lib/strings"

export function ScrollToTop() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-none"
      onClick={() => {
        const reduced = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
        window.scrollTo({
          top: 0,
          behavior: reduced ? "auto" : "smooth",
        })
      }}
    >
      <ArrowUpIcon data-icon="inline-start" />
      {strings.footer.backToTop}
    </Button>
  )
}
