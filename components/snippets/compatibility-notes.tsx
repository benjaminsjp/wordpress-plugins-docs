import { SectionHeading } from "@/components/layout/section-heading"
import { strings } from "@/lib/strings"
import type { SnippetRecord } from "@/lib/content/load-snippets"

export function CompatibilityNotes({
  compatibility,
}: {
  compatibility: NonNullable<SnippetRecord["compatibility"]>
}) {
  return (
    <section className="flex flex-col gap-2">
      <SectionHeading>{strings.snippets.compatibility}</SectionHeading>
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
