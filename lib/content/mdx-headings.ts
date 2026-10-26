import { headingId } from "@/lib/plugin-view"
import type { TocItem } from "@/lib/toc"

export function extractMdxHeadings(source: string): TocItem[] {
  const items: TocItem[] = []
  let inFence = false

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed.startsWith("```")) {
      inFence = !inFence
      continue
    }
    if (inFence) {
      continue
    }

    const match = /^(#{2,3})\s+(.+)$/.exec(trimmed)
    if (!match) {
      continue
    }

    const title = match[2]
      .replace(/\s+#+\s*$/, "")
      .replace(/\s*\{#[\w-]+\}\s*$/, "")
      .replace(/[*_`]/g, "")
      .trim()
    if (!title) {
      continue
    }

    items.push({
      id: headingId(title),
      title,
      level: match[1].length === 3 ? 3 : 2,
    })
  }

  return items
}
