import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DocsWithToc } from "@/components/layout/docs-with-toc"
import { PageHero } from "@/components/layout/page-hero"
import { SectionHeading } from "@/components/layout/section-heading"
import { SnippetCode } from "@/components/snippets/snippet-code"
import { MdxProse } from "@/components/mdx/prose"
import { CompatibilityNotes } from "@/components/snippets/compatibility-notes"
import { PlacementCallout } from "@/components/snippets/placement-callout"
import { RelatedSnippets } from "@/components/snippets/related-snippets"
import { TagBadges } from "@/components/snippets/tag-badges"
import { Badge } from "@/components/ui/badge"
import { extractMdxHeadings } from "@/lib/content/mdx-headings"
import {
  loadSnippetNotes,
  readSnippetNotesSource,
} from "@/lib/content/load-mdx"
import { getSnippet, getSnippets, getTaxonomy } from "@/lib/content"
import { formatDate } from "@/lib/format"
import { strings } from "@/lib/strings"
import { buildSnippetToc } from "@/lib/toc"

export const dynamicParams = false

export async function generateStaticParams() {
  const snippets = await getSnippets()
  return snippets.map((snippet) => ({ slug: snippet.slug }))
}

type SnippetPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: SnippetPageProps): Promise<Metadata> {
  const { slug } = await params
  const snippet = await getSnippet(slug)
  if (!snippet) {
    return { title: strings.notFound.title }
  }
  return { title: snippet.name, description: snippet.summary }
}

export default async function SnippetPage({
  params,
}: SnippetPageProps) {
  const { slug } = await params
  const [snippet, snippets, taxonomy, Notes, notesSource] = await Promise.all([
    getSnippet(slug),
    getSnippets(),
    getTaxonomy(),
    loadSnippetNotes(slug),
    readSnippetNotesSource(slug),
  ])

  if (!snippet) {
    notFound()
  }

  const category = taxonomy?.categories.find(
    (item) => item.slug === snippet.category
  )
  const subcategory = category?.subcategories.find(
    (item) => item.slug === snippet.subcategory
  )
  const tagLabels = (taxonomy?.tags ?? []).filter((tag) =>
    snippet.tags.includes(tag.slug)
  )
  const related = (snippet.related ?? [])
    .map((relatedSlug) =>
      snippets.find((item) => item.slug === relatedSlug)
    )
    .filter((item) => item !== undefined)
  const categoryLabelBySlug = Object.fromEntries(
    (taxonomy?.categories ?? []).map((item) => [item.slug, item.label])
  )
  const toc = buildSnippetToc({
    hasCompatibility: Boolean(snippet.compatibility),
    hasNotes: Boolean(Notes),
    hasRelated: related.length > 0,
    notesHeadings: notesSource ? extractMdxHeadings(notesSource) : [],
  })

  return (
    <>
      <PageHero
        title={snippet.name}
        description={snippet.summary}
        eyebrow={
          <>
            {category ? (
              <Badge
                variant="outline"
                render={<Link href={`/css/category/${category.slug}`} />}
              >
                {category.label}
              </Badge>
            ) : null}
            {subcategory && category ? (
              <Badge
                variant="outline"
                render={
                  <Link
                    href={`/css/category/${category.slug}/${subcategory.slug}`}
                  />
                }
              >
                {subcategory.label}
              </Badge>
            ) : null}
            <TagBadges tags={tagLabels} />
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          {strings.plugins.updatedOn(formatDate(snippet.updated))}
        </p>
      </PageHero>
      <DocsWithToc items={toc}>
          <PlacementCallout
            location={snippet.placement.location}
            notes={snippet.placement.notes}
          />
          {snippet.compatibility ? (
            <CompatibilityNotes compatibility={snippet.compatibility} />
          ) : null}
          <section className="flex min-w-0 flex-col gap-4">
            <SectionHeading>{strings.snippets.code}</SectionHeading>
            <SnippetCode code={snippet.css} tokens={snippet.tokens} />
          </section>
          {Notes ? (
            <section className="flex flex-col gap-4">
              <SectionHeading>{strings.snippets.notes}</SectionHeading>
              <MdxProse>
                <Notes />
              </MdxProse>
            </section>
          ) : null}
          <RelatedSnippets
            snippets={related}
            categoryLabelBySlug={categoryLabelBySlug}
          />
      </DocsWithToc>
    </>
  )
}
