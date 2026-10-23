import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getNavData } from "@/lib/get-nav-data"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: strings.site.name,
    template: `%s · ${strings.site.name}`,
  },
  description: strings.site.description,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const nav = await getNavData()

  return (
    <html
      lang="nb"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased font-sans",
        geistSans.variable,
        geistMono.variable
      )}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#innhold"
          className="sr-only focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-4xl focus-visible:bg-background focus-visible:px-3 focus-visible:py-2 focus-visible:text-sm focus-visible:font-medium focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {strings.nav.skipToContent}
        </a>
        <ThemeProvider>
          <TooltipProvider>
            <SidebarProvider>
              <AppSidebar nav={nav} />
              <SidebarInset className="min-w-0">
                <SiteHeader nav={nav} />
                <main id="innhold" className="min-w-0 flex-1">
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
