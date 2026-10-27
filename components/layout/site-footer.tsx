import { ArrowUpRightIcon } from "lucide-react"
import { FooterRain } from "@/components/layout/footer-rain"
import { ScrollToTop } from "@/components/layout/scroll-to-top"
import { ModeToggle } from "@/components/theme/mode-toggle"
import { getPlugins, getSnippets } from "@/lib/content"
import {
  buildFooterLexicon,
  latestContentDate,
} from "@/lib/content/footer-data"
import { formatDate } from "@/lib/format"
import { strings } from "@/lib/strings"
import { cn } from "@/lib/utils"

const FOOTER_LINK =
  "rounded-none underline-offset-3 hover:text-chart-3 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"

export async function SiteFooter() {
  const [plugins, snippets] = await Promise.all([
    getPlugins(),
    getSnippets(),
  ])
  const words = buildFooterLexicon(plugins, snippets)
  const updated = formatDate(latestContentDate(plugins, snippets))
  const year = new Date().getFullYear()
  const [firstMaintainer, secondMaintainer] = strings.footer.maintainers

  return (
    <footer className="mt-auto bg-background pt-16 md:pt-24">
      <div className="relative">
        <FooterRain words={words} />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-gradient-to-b from-background from-5% via-background/70 to-transparent"
        />
      </div>
      <div className="mx-auto flex w-full max-w-[1100px] min-w-0 flex-col gap-8 px-6 py-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-xl flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center bg-primary font-heading font-semibold text-primary-foreground">
                {strings.site.mark}
              </span>
              <span className="font-heading text-lg font-semibold">
                {strings.site.shortName}
              </span>
            </div>
            {firstMaintainer && secondMaintainer ? (
              <p className="text-sm text-muted-foreground">
                {strings.footer.developedBy}{" "}
                <MaintainerLink maintainer={firstMaintainer} />{" "}
                {strings.footer.and}{" "}
                <MaintainerLink maintainer={secondMaintainer} />.
              </p>
            ) : null}
          </div>
          <nav aria-label={strings.footer.githubHeading} className="flex flex-col gap-2">
            <p className="text-sm font-medium">{strings.footer.githubHeading}</p>
            <ul className="flex flex-col gap-1.5">
              {strings.footer.github.map((item) => (
                <li key={item.label}>
                  <GitHubItem item={item} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-[1100px] min-w-0 flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {strings.footer.copyright(year, updated)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <ScrollToTop />
            <ModeToggle className="rounded-none" />
          </div>
        </div>
      </div>
    </footer>
  )
}

function MaintainerLink({
  maintainer,
}: {
  maintainer: { name: string; href: string }
}) {
  if (!maintainer.href) {
    return <span className="font-medium text-foreground">{maintainer.name}</span>
  }

  return (
    <a
      href={maintainer.href}
      className={cn("font-medium text-foreground", FOOTER_LINK)}
      target="_blank"
      rel="noreferrer"
    >
      {maintainer.name}
    </a>
  )
}

function GitHubItem({ item }: { item: { label: string; href: string } }) {
  const className =
    "group flex items-center gap-2 text-sm text-muted-foreground"

  if (!item.href) {
    return (
      <span className={className}>
        <ExternalMarker />
        {item.label}
      </span>
    )
  }

  return (
    <a
      href={item.href}
      className={cn(className, FOOTER_LINK)}
      target="_blank"
      rel="noreferrer"
    >
      <ExternalMarker />
      {item.label}
    </a>
  )
}

function ExternalMarker() {
  return (
    <span
      aria-hidden
      className="relative flex size-4 shrink-0 items-center justify-center"
    >
      <span
        className={cn(
          "size-1.5 bg-muted-foreground transition duration-200 ease-out",
          "group-hover:scale-0 group-hover:bg-chart-3 group-hover:opacity-0",
          "group-focus-visible:scale-0 group-focus-visible:opacity-0",
          "motion-reduce:transition-none"
        )}
      />
      <span
        className={cn(
          "absolute inset-0 border border-transparent transition duration-200 ease-out",
          "group-hover:scale-110 group-hover:border-chart-3",
          "group-focus-visible:scale-110 group-focus-visible:border-chart-3",
          "motion-reduce:transition-none"
        )}
      />
      <ArrowUpRightIcon
        className={cn(
          "absolute size-2.5 text-chart-3 opacity-0",
          "origin-bottom-left translate-x-[-40%] translate-y-[40%] scale-50",
          "transition duration-200 ease-out",
          "group-hover:translate-x-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100",
          "group-focus-visible:translate-x-0 group-focus-visible:translate-y-0 group-focus-visible:scale-100 group-focus-visible:opacity-100",
          "motion-reduce:transition-none"
        )}
      />
    </span>
  )
}
