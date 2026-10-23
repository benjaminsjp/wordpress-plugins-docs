import type { ReleaseRecord } from "@/lib/content/load-plugins"
import { strings } from "@/lib/strings"

export function RequirementsList({ release }: { release: ReleaseRecord }) {
  const items = [
    {
      label: strings.plugins.wordpress,
      requirement: release.requirements.wordpress,
    },
    {
      label: strings.plugins.php,
      requirement: release.requirements.php,
    },
    release.requirements.flatsome
      ? {
          label: strings.plugins.flatsome,
          requirement: release.requirements.flatsome,
        }
      : null,
  ].filter((item) => item !== null)

  return (
    <dl className="grid gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd>
            {strings.plugins.minLabel(item.requirement.min)}
            {item.requirement.tested
              ? ` · ${strings.plugins.testedLabel(item.requirement.tested)}`
              : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
