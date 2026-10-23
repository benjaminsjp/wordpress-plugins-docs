import { readFile } from "node:fs/promises"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { loadSnippets } from "@/lib/content/load-snippets"
import { CONTENT_ROOT, getContentPaths } from "@/lib/content/paths"
import { strings } from "@/lib/strings"

describe("snippet CSS source", () => {
  it("keeps the exact snippet.css bytes for copy", async () => {
    const { snippets } = await loadSnippets(getContentPaths())
    const snippet = snippets.find(
      (item) => item.slug === "header-dropdown-shadow"
    )
    expect(snippet).toBeDefined()
    const raw = await readFile(
      path.join(
        CONTENT_ROOT,
        "snippets",
        "header-dropdown-shadow",
        "snippet.css"
      ),
      "utf8"
    )
    expect(snippet?.css).toBe(raw)
  })
})

describe("placement labels", () => {
  it("covers every placement location", () => {
    expect(Object.keys(strings.snippets.placement).sort()).toEqual(
      [
        "child-theme-stylesheet",
        "flatsome-custom-css-all",
        "flatsome-custom-css-mobile",
        "flatsome-custom-css-tablet",
        "other",
        "wordpress-additional-css",
      ].sort()
    )
  })
})
