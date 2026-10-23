import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  PageBreadcrumbs,
  type BreadcrumbEntry,
} from "@/components/layout/page-breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { CodeBlock } from "@/components/code/code-block"
import { MdxProse } from "@/components/mdx/prose"
import { CompatibilityNotes } from "@/components/snippets/compatibility-notes"
import { PlacementCallout } from "@/components/snippets/placement-callout"
import { RelatedSnippets } from "@/components/snippets/related-snippets"
import { TagBadges } from "@/components/snippets/tag-badges"
import { Badge } from "@/components/ui/badge"
import { loadSnippetNotes } from "@/lib/content/load-mdx"
import { getSnippet, getSnippets, getTaxonomy } from "@/lib/content"
import { formatDate } from "@/lib/format"
import { strings } from "@/lib/strings"

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
  const [snippet, snippets, taxonomy] = await Promise.all([
    getSnippet(slug),
    getSnippets(),
    getTaxonomy(),
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
  const Notes = snippet.notesFile ? await loadSnippetNotes(snippet.slug) : null

  const crumbs: BreadcrumbEntry[] = [
    { label: strings.nav.home, href: "/" },
    { label: strings.nav.snippets, href: "/css" },
  ]
  if (category) {
    crumbs.push({
      label: category.label,
      href: `/css/category/${category.slug}`,
    })
  }
  if (subcategory && category) {
    crumbs.push({
      label: subcategory.label,
      href: `/css/category/${category.slug}/${subcategory.slug}`,
    })
  }
  crumbs.push({ label: snippet.name })

  return (
    <PageShell>
      <PageBreadcrumbs items={crumbs} />
      <PageHeader title={snippet.name} description={snippet.summary}>
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
      </PageHeader>
      <p className="text-sm text-muted-foreground">
        {strings.snippets.updated} {formatDate(snippet.updated)}
      </p>
      <PlacementCallout
        location={snippet.placement.location}
        notes={snippet.placement.notes}
      />
      {snippet.compatibility ? (
        <CompatibilityNotes compatibility={snippet.compatibility} />
      ) : null}
      <section className="flex min-w-0 flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">
          {strings.snippets.code}
        </h2>
        <CodeBlock code={snippet.css} language="css" />
      </section>
      {Notes ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-xl font-medium">
            {strings.snippets.notes}
          </h2>
          <MdxProse>
            <Notes />
          </MdxProse>
        </section>
      ) : null}
      <RelatedSnippets
        snippets={related}
        categoryLabelBySlug={categoryLabelBySlug}
      />
    </PageShell>
  )
}
