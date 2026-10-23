import type { ReleaseRecord } from "@/lib/content/load-plugins"
import { strings } from "@/lib/strings"

const CHANGELOG_SECTIONS = [
  ["added", "changelogAdded"],
  ["changed", "changelogChanged"],
  ["fixed", "changelogFixed"],
  ["removed", "changelogRemoved"],
  ["security", "changelogSecurity"],
] as const

export function hasChangelogContent(
  release: ReleaseRecord,
  fileUrl?: string
): boolean {
  if (fileUrl) {
    return true
  }

  const changelog = release.changelog
  if (!changelog) {
    return false
  }

  return CHANGELOG_SECTIONS.some(([key]) => (changelog[key] ?? []).length > 0)
}

export function Changelog({
  release,
  fileUrl,
}: {
  release: ReleaseRecord
  fileUrl?: string
}) {
  const changelog = release.changelog
  const sections = CHANGELOG_SECTIONS.filter(
    ([key]) => (changelog?.[key] ?? []).length > 0
  )

  if (sections.length === 0 && !fileUrl) {
    return null
  }

  return (
    <div className="flex flex-col gap-3">
      {sections.map(([key, labelKey]) => (
        <div key={key} className="flex flex-col gap-2">
          <p className="font-medium">{strings.plugins[labelKey]}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            {changelog?.[key]?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      {fileUrl ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="w-fit underline-offset-3 hover:underline"
        >
          {strings.plugins.fullChangelog}
        </a>
      ) : null}
    </div>
  )
}
