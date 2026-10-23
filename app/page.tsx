import Link from "next/link"
import { PageHero } from "@/components/layout/page-hero"
import { PageShell } from "@/components/layout/page-shell"
import { SearchTrigger } from "@/components/search/search-command"
import { CategoryCard } from "@/components/snippets/category-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPlugins, getSnippets, getTaxonomy } from "@/lib/content"
import { formatDate } from "@/lib/format"
import { listLatestReleases, listRecentSnippets } from "@/lib/nav"
import { strings } from "@/lib/strings"

export default async function HomePage() {
  const [plugins, snippets, taxonomy] = await Promise.all([
    getPlugins(),
    getSnippets(),
    getTaxonomy(),
  ])
  const latestReleases = listLatestReleases(plugins)
  const recentSnippets = listRecentSnippets(snippets)
  const categories = taxonomy?.categories ?? []

  return (
    <>
      <PageHero title={strings.home.title} description={strings.home.intro} />
      <PageShell>
        <SearchTrigger />
        <section className="grid gap-4 sm:grid-cols-2">
          <Link href="/plugins">
            <Card className="h-full border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{strings.home.pluginCount(plugins.length)}</CardTitle>
                <CardDescription>{strings.home.viewAllPlugins}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link href="/css">
            <Card className="h-full border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle>{strings.home.snippetCount(snippets.length)}</CardTitle>
                <CardDescription>{strings.home.viewAllSnippets}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {strings.home.latestReleases}
          </h2>
          <div className="flex flex-col gap-3">
            {latestReleases.map((release) => (
              <Link
                key={`${release.pluginSlug}-${release.version}`}
                href={release.href}
              >
                <Card className="border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{release.pluginName}</CardTitle>
                      <Badge variant="default">
                        {strings.version(release.version)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatDate(release.releaseDate)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {strings.home.recentSnippets}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recentSnippets.map((snippet) => {
              const category = categories.find(
                (item) => item.slug === snippet.category
              )
              return (
                <Link key={snippet.slug} href={`/css/${snippet.slug}`}>
                  <Card className="h-full border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle>{snippet.name}</CardTitle>
                        {category ? (
                          <Badge variant="outline">{category.label}</Badge>
                        ) : null}
                      </div>
                      <CardDescription>{snippet.summary}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-2xl font-semibold tracking-tight">
              {strings.home.categories}
            </h2>
            <p className="text-sm text-muted-foreground">
              {strings.home.categoriesHint}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const count = snippets.filter(
                (snippet) => snippet.category === category.slug
              ).length
              return (
                <CategoryCard
                  key={category.slug}
                  href={`/css/category/${category.slug}`}
                  label={category.label}
                  count={count}
                />
              )
            })}
          </div>
        </section>
      </PageShell>
    </>
  )
}
