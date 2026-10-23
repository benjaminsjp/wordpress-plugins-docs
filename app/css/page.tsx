import type { Metadata } from "next"
import Link from "next/link"
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { SnippetCard } from "@/components/snippets/snippet-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getSnippets, getTaxonomy } from "@/lib/content"
import { listRecentSnippets } from "@/lib/nav"
import { strings } from "@/lib/strings"
import { CodeIcon } from "lucide-react"

export const metadata: Metadata = {
  title: strings.snippets.title,
}

export default async function CssPage() {
  const [snippets, taxonomy] = await Promise.all([
    getSnippets(),
    getTaxonomy(),
  ])
  const categories = taxonomy?.categories ?? []
  const tags = taxonomy?.tags ?? []
  const recent = listRecentSnippets(snippets)

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { label: strings.nav.home, href: "/" },
          { label: strings.nav.snippets },
        ]}
      />
      <PageHeader
        title={strings.snippets.title}
        description={strings.snippets.description}
      />
      {snippets.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CodeIcon />
            </EmptyMedia>
            <EmptyTitle>{strings.snippets.emptyTitle}</EmptyTitle>
            <EmptyDescription>
              {strings.snippets.emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">
              {strings.home.categories}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const count = snippets.filter(
                  (snippet) => snippet.category === category.slug
                ).length
                return (
                  <Link
                    key={category.slug}
                    href={`/css/category/${category.slug}`}
                  >
                    <Card className="h-full transition-colors hover:bg-muted/40">
                      <CardHeader>
                        <CardTitle>{category.label}</CardTitle>
                        <CardDescription>
                          {strings.home.snippetCountInCategory(count)}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-medium">
              {strings.snippets.tags}
            </h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.slug}
                  variant="secondary"
                  render={<Link href={`/css/tag/${tag.slug}`} />}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">
              {strings.home.recentSnippets}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {recent.map((snippet) => {
                const category = categories.find(
                  (item) => item.slug === snippet.category
                )
                return (
                  <SnippetCard
                    key={snippet.slug}
                    snippet={snippet}
                    categoryLabel={category?.label}
                  />
                )
              })}
            </div>
          </section>
        </>
      )}
    </PageShell>
  )
}
