import { readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { extractMdxHeadings } from "@/lib/content/mdx-headings"
import { CONTENT_ROOT } from "@/lib/content/paths"
import { headingId as slugify } from "@/lib/plugin-view"
import { strings } from "@/lib/strings"
import { buildPluginToc, buildSnippetToc } from "@/lib/toc"

describe("extractMdxHeadings", () => {
  it("reads h2 and h3 and skips fenced code", () => {
    expect(
      extractMdxHeadings(`## Oversikt

Tekst

\`\`\`css
### ikke en overskrift
\`\`\`

### Filter i wp-admin

#### For dyp
`)
    ).toEqual([
      { id: "oversikt", title: "Oversikt", level: 2 },
      { id: "filter-i-wp-admin", title: "Filter i wp-admin", level: 3 },
    ])
  })

  it("extracts usage headings from the blogg plugin", async () => {
    const source = await readFile(
      path.join(
        CONTENT_ROOT,
        "plugins/blogg-post-plugin-for-flatsome/docs/usage.mdx"
      ),
      "utf8"
    )
    expect(extractMdxHeadings(source)).toEqual([
      { id: "filter-i-wp-admin", title: "Filter i wp-admin", level: 3 },
      { id: "flatsome-elementer", title: "Flatsome-elementer", level: 3 },
    ])
  })
})

describe("buildPluginToc", () => {
  it("includes nested usage headings when usage exists", () => {
    const toc = buildPluginToc({
      hasLatest: true,
      hasOverview: true,
      hasUsage: true,
      hasRelated: false,
      usageHeadings: extractMdxHeadings("### Filter i wp-admin\n"),
    })
    expect(toc.map((item) => item.id)).toEqual([
      slugify(strings.plugins.requirements),
      slugify(strings.plugins.dependencies),
      slugify(strings.plugins.usedBy),
      slugify(strings.plugins.overview),
      slugify(strings.plugins.installation),
      slugify(strings.plugins.usage),
      "filter-i-wp-admin",
      slugify(strings.plugins.versions),
    ])
  })

  it("omits latest and usage sections when they are missing", () => {
    const toc = buildPluginToc({
      hasLatest: false,
      hasOverview: false,
      hasUsage: false,
      hasRelated: true,
    })
    expect(toc.map((item) => item.title)).toEqual([
      strings.plugins.usedBy,
      strings.plugins.installation,
      strings.plugins.versions,
      strings.plugins.related,
    ])
  })
})

describe("buildSnippetToc", () => {
  it("always starts with placement and code", () => {
    const toc = buildSnippetToc({
      hasCompatibility: false,
      hasNotes: false,
      hasRelated: false,
    })
    expect(toc).toEqual([
      {
        id: slugify(strings.snippets.placementTitle),
        title: strings.snippets.placementTitle,
        level: 2,
      },
      {
        id: slugify(strings.snippets.code),
        title: strings.snippets.code,
        level: 2,
      },
    ])
  })
})
