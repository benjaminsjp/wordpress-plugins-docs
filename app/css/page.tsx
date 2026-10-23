import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { PageShell } from "@/components/layout/page-shell"
import { CategoryCard } from "@/components/snippets/category-card"
import { SnippetCard } from "@/components/snippets/snippet-card"
import { Badge } from "@/components/ui/badge"
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
import Link from "next/link"

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
    <>
      <PageHero
        title={strings.snippets.title}
        description={strings.snippets.description}
      />
      <PageShell>
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
            <section className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {strings.snippets.tags}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {strings.snippets.tagsHint}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.slug}
                    variant="outline"
                    render={<Link href={`/css/tag/${tag.slug}`} />}
                  >
                    {tag.label}
                  </Badge>
                ))}
              </div>
            </section>
            <section className="flex flex-col gap-4">
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
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
    </>
  )
}
