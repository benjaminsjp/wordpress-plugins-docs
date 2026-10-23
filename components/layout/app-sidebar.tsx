"use client"

import { useEffect, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDownIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { strings } from "@/lib/strings"
import type { NavData } from "@/lib/nav"

export function AppSidebar({ nav }: { nav: NavData }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const snippetLocation = snippetLocationFromPath(
    pathname,
    nav.snippetLocations
  )

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/" />}
              isActive={pathname === "/"}
            >
              {strings.site.name}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavSection label={strings.nav.plugins}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/plugins" />}
                isActive={pathname === "/plugins"}
              >
                {strings.nav.allPlugins}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {nav.plugins.map((plugin) => (
              <SidebarMenuItem key={plugin.slug}>
                <SidebarMenuButton
                  render={<Link href={plugin.href} />}
                  isActive={pathname === plugin.href}
                >
                  {plugin.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </NavSection>
        <NavSection label={strings.nav.snippets}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href="/css" />}
                isActive={pathname === "/css"}
              >
                {strings.nav.allSnippets}
              </SidebarMenuButton>
            </SidebarMenuItem>
            {nav.categories.map((category) => {
              const categoryActive =
                pathname === category.href ||
                pathname.startsWith(`${category.href}/`) ||
                snippetLocation?.category === category.slug

              return (
                <SidebarMenuItem key={category.slug}>
                  <SidebarMenuButton
                    render={<Link href={category.href} />}
                    isActive={categoryActive}
                  >
                    {category.label}
                    <SidebarMenuBadge>{category.count}</SidebarMenuBadge>
                  </SidebarMenuButton>
                  {category.subcategories.length > 0 ? (
                    <SidebarMenuSub>
                      {category.subcategories.map((subcategory) => {
                        const subActive =
                          pathname === subcategory.href ||
                          (snippetLocation?.category === category.slug &&
                            snippetLocation?.subcategory === subcategory.slug)

                        return (
                          <SidebarMenuSubItem key={subcategory.slug}>
                            <SidebarMenuSubButton
                              render={<Link href={subcategory.href} />}
                              isActive={subActive}
                            >
                              {subcategory.label}
                              <SidebarMenuBadge>
                                {subcategory.count}
                              </SidebarMenuBadge>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </NavSection>
      </SidebarContent>
    </Sidebar>
  )
}

function NavSection({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel render={<CollapsibleTrigger />}>
          {label}
          <ChevronDownIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-180" />
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>{children}</SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function snippetLocationFromPath(
  pathname: string,
  locations: NavData["snippetLocations"]
) {
  const match = /^\/css\/([^/]+)$/.exec(pathname)
  if (!match) return undefined
  const slug = match[1]
  if (slug === "category" || slug === "tag") return undefined
  return locations[slug]
}
