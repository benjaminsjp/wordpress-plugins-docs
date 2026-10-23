import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
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
  return (taxonomy?.categories ?? []).flatMap((category) =>
    category.subcategories.map((subcategory) => ({
      category: category.slug,
      subcategory: subcategory.slug,
    }))
  )
}

type SubcategoryPageProps = {
  params: Promise<{ category: string; subcategory: string }>
}

export async function generateMetadata({
  params,
}: SubcategoryPageProps): Promise<Metadata> {
  const { category: categorySlug, subcategory: subcategorySlug } = await params
  const taxonomy = await getTaxonomy()
  const category = taxonomy?.categories.find((item) => item.slug === categorySlug)
  const subcategory = category?.subcategories.find(
    (item) => item.slug === subcategorySlug
  )
  return { title: subcategory?.label ?? strings.notFound.title }
}

export default async function SubcategoryPage({
  params,
}: SubcategoryPageProps) {
  const { category: categorySlug, subcategory: subcategorySlug } = await params
  const [snippets, taxonomy] = await Promise.all([
    getSnippets(),
    getTaxonomy(),
  ])
  const category = taxonomy?.categories.find((item) => item.slug === categorySlug)
  const subcategory = category?.subcategories.find(
    (item) => item.slug === subcategorySlug
  )

  if (!category || !subcategory) {
    notFound()
  }

  const inSubcategory = snippets.filter(
    (snippet) =>
      snippet.category === category.slug &&
      snippet.subcategory === subcategory.slug
  )

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { label: strings.nav.home, href: "/" },
          { label: strings.nav.snippets, href: "/css" },
          { label: category.label, href: `/css/category/${category.slug}` },
          { label: subcategory.label },
        ]}
      />
      <PageHeader
        title={subcategory.label}
        description={subcategory.description}
      />
      {inSubcategory.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CodeIcon />
            </EmptyMedia>
            <EmptyTitle>{strings.snippets.emptyCategoryTitle}</EmptyTitle>
            <EmptyDescription>
              {strings.snippets.emptyCategoryDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {inSubcategory.map((snippet) => (
            <SnippetCard
              key={snippet.slug}
              snippet={snippet}
              categoryLabel={category.label}
            />
          ))}
        </div>
      )}
    </PageShell>
  )
}
