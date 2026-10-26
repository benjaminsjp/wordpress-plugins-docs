import { headingId } from "@/lib/plugin-view"
import { strings } from "@/lib/strings"

export type TocItem = {
  id: string
  title: string
  level: 2 | 3
}

export function tocItem(title: string, level: 2 | 3 = 2): TocItem {
  return { id: headingId(title), title, level }
}

export function buildPluginToc(options: {
  hasLatest: boolean
  hasOverview: boolean
  hasUsage: boolean
  hasRelated: boolean
  usageHeadings?: TocItem[]
}): TocItem[] {
  const items: TocItem[] = []

  if (options.hasLatest) {
    items.push(tocItem(strings.plugins.requirements))
    items.push(tocItem(strings.plugins.dependencies))
  }

  items.push(tocItem(strings.plugins.usedBy))

  if (options.hasOverview) {
    items.push(tocItem(strings.plugins.overview))
  }

  items.push(tocItem(strings.plugins.installation))

  if (options.hasUsage) {
    items.push(tocItem(strings.plugins.usage))
    items.push(
      ...(options.usageHeadings ?? []).filter((item) => item.level === 3)
    )
  }

  items.push(tocItem(strings.plugins.versions))

  if (options.hasRelated) {
    items.push(tocItem(strings.plugins.related))
  }

  return items
}

export function buildSnippetToc(options: {
  hasCompatibility: boolean
  hasNotes: boolean
  hasRelated: boolean
  notesHeadings?: TocItem[]
}): TocItem[] {
  const items: TocItem[] = [tocItem(strings.snippets.placementTitle)]

  if (options.hasCompatibility) {
    items.push(tocItem(strings.snippets.compatibility))
  }

  items.push(tocItem(strings.snippets.code))

  if (options.hasNotes) {
    items.push(tocItem(strings.snippets.notes))
    items.push(
      ...(options.notesHeadings ?? []).filter((item) => item.level === 3)
    )
  }

  if (options.hasRelated) {
    items.push(tocItem(strings.snippets.related))
  }

  return items
}
