import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageHero } from "@/components/layout/page-hero"
import { PageShell } from "@/components/layout/page-shell"
import { SnippetCard } from "@/components/snippets/snippet-card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getSnippets, getTaxonomy } from "@/lib/content"
import { strings } from "@/lib/strings"
import { CodeIcon } from "lucide-react"

export const dynamicParams = false

export async function generateStaticParams() {
  const taxonomy = await getTaxonomy()
  return (taxonomy?.tags ?? []).map((tag) => ({ tag: tag.slug }))
}

type TagPageProps = {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({
  params,
}: TagPageProps): Promise<Metadata> {
  const { tag: tagSlug } = await params
  const taxonomy = await getTaxonomy()
  const tag = taxonomy?.tags.find((item) => item.slug === tagSlug)
  return { title: tag?.label ?? strings.notFound.title }
}

export default async function TagPage({
  params,
}: TagPageProps) {
  const { tag: tagSlug } = await params
  const [snippets, taxonomy] = await Promise.all([
    getSnippets(),
    getTaxonomy(),
  ])
  const tag = taxonomy?.tags.find((item) => item.slug === tagSlug)

  if (!tag) {
    notFound()
  }

  const tagged = snippets.filter((snippet) => snippet.tags.includes(tag.slug))
  const categories = taxonomy?.categories ?? []

  return (
    <>
      <PageHero title={tag.label} description={tag.description} />
      <PageShell>
      {tagged.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CodeIcon />
            </EmptyMedia>
            <EmptyTitle>{strings.snippets.emptyTagTitle}</EmptyTitle>
            <EmptyDescription>
              {strings.snippets.emptyTagDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tagged.map((snippet) => {
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
      )}
      </PageShell>
    </>
  )
}
