import { SnippetCard } from "@/components/snippets/snippet-card"
import type { SnippetRecord } from "@/lib/content/load-snippets"
import { strings } from "@/lib/strings"

export function RelatedSnippets({
  snippets,
  categoryLabelBySlug,
}: {
  snippets: SnippetRecord[]
  categoryLabelBySlug: Record<string, string>
}) {
  if (snippets.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        {strings.snippets.related}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {snippets.map((snippet) => (
          <SnippetCard
            key={snippet.slug}
            snippet={snippet}
            categoryLabel={categoryLabelBySlug[snippet.category]}
          />
        ))}
      </div>
    </section>
  )
}
