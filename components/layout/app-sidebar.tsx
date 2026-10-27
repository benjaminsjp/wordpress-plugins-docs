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
import { SiteLogo } from "@/components/layout/site-logo"
import { strings } from "@/lib/strings"
import type { NavData } from "@/lib/nav"

export function AppSidebar({ nav }: { nav: NavData }) {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()
  const snippetLocation = snippetLocationFromPath(
    pathname,
    nav.snippetLocations
  )
  const categories = nav.categories.filter((category) => category.count > 0)

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
              className="h-auto py-3"
            >
              <SiteLogo />
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
              <CountBadge count={nav.pluginCount} />
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
              <CountBadge count={nav.snippetCount} />
            </SidebarMenuItem>
            {categories.map((category) => {
              const categoryActive =
                pathname === category.href ||
                pathname.startsWith(`${category.href}/`) ||
                snippetLocation?.category === category.slug
              const subcategories = category.subcategories.filter(
                (subcategory) => subcategory.count > 0
              )

              return (
                <SidebarMenuItem key={category.slug}>
                  <SidebarMenuButton
                    render={<Link href={category.href} />}
                    isActive={categoryActive}
                  >
                    {category.label}
                  </SidebarMenuButton>
                  <CountBadge count={category.count} />
                  {categoryActive && subcategories.length > 0 ? (
                    <SidebarMenuSub>
                      {subcategories.map((subcategory) => {
                        const subActive =
                          pathname === subcategory.href ||
                          (snippetLocation?.category === category.slug &&
                            snippetLocation?.subcategory === subcategory.slug)

                        return (
                          <SidebarMenuSubItem key={subcategory.slug}>
                            <SidebarMenuSubButton
                              render={<Link href={subcategory.href} />}
                              isActive={subActive}
                              className="peer/menu-button"
                            >
                              {subcategory.label}
                            </SidebarMenuSubButton>
                            <CountBadge count={subcategory.count} />
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

function CountBadge({ count }: { count: number }) {
  return (
    <SidebarMenuBadge className="top-1.5 bg-sidebar-accent text-sidebar-accent-foreground peer-data-active/menu-button:bg-sidebar-primary peer-data-active/menu-button:text-sidebar-primary-foreground">
      {count}
    </SidebarMenuBadge>
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
