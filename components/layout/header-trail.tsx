"use client"

import { usePathname } from "next/navigation"
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs"
import { breadcrumbTrail, type NavData } from "@/lib/nav"

export function HeaderTrail({ nav }: { nav: NavData }) {
  const pathname = usePathname()
  return <PageBreadcrumbs items={breadcrumbTrail(pathname, nav)} />
}
