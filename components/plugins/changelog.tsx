import type { ReleaseRecord } from "@/lib/content/load-plugins"
import { strings } from "@/lib/strings"

const CHANGELOG_SECTIONS = [
  ["added", "changelogAdded"],
  ["changed", "changelogChanged"],
  ["fixed", "changelogFixed"],
  ["removed", "changelogRemoved"],
  ["security", "changelogSecurity"],
] as const

export function Changelog({ release }: { release: ReleaseRecord }) {
  const changelog = release.changelog
  if (!changelog) {
    return null
  }

  const sections = CHANGELOG_SECTIONS.filter(
    ([key]) => (changelog[key] ?? []).length > 0
  )

  if (sections.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map(([key, labelKey]) => (
        <div key={key} className="flex flex-col gap-2">
          <p className="font-medium">{strings.plugins[labelKey]}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {changelog[key]?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
