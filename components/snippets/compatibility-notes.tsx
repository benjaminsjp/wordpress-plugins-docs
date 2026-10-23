import { strings } from "@/lib/strings"
import type { SnippetRecord } from "@/lib/content/load-snippets"

export function CompatibilityNotes({
  compatibility,
}: {
  compatibility: NonNullable<SnippetRecord["compatibility"]>
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        {strings.snippets.compatibility}
      </h2>
      {compatibility.flatsome ? (
        <p>
          {strings.plugins.flatsome}:{" "}
          {strings.plugins.minLabel(compatibility.flatsome.min)}
          {compatibility.flatsome.tested
            ? ` · ${strings.plugins.testedLabel(compatibility.flatsome.tested)}`
            : null}
        </p>
      ) : null}
      {compatibility.notes ? (
        <p className="text-muted-foreground">{compatibility.notes}</p>
      ) : null}
    </section>
  )
}
