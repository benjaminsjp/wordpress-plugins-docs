"use client"

import Link from "next/link"
import { SearchCommand, SearchTrigger } from "@/components/search/search-command"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { strings } from "@/lib/strings"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4">
      <SidebarTrigger />
      <Link href="/" className="min-w-0 truncate font-medium">
        {strings.site.name}
      </Link>
      <SearchTrigger compact className="ml-auto" />
      <SearchCommand />
    </header>
  )
}
