"use client"

import { HeaderTrail } from "@/components/layout/header-trail"
import { SearchCommand, SearchTrigger } from "@/components/search/search-command"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { NavData } from "@/lib/nav"

export function SiteHeader({ nav }: { nav: NavData }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b-2 border-b-chart-3 bg-background px-4">
      <SidebarTrigger />
      <div className="min-w-0 flex-1 overflow-hidden">
        <HeaderTrail nav={nav} />
      </div>
      <SearchTrigger
        compact
        className="shrink-0 max-sm:size-8 max-sm:p-0 sm:min-w-56 md:min-w-64"
      />
      <ModeToggle />
      <SearchCommand />
    </header>
  )
}
