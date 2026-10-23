import { describe, expect, it } from "vitest"
import {
  buildSearchIndex,
  extractCssSelectors,
} from "@/lib/content/search-index"
import { loadAndValidate } from "@/lib/content/validate"

describe("extractCssSelectors", () => {
  it("extracts class and ID selectors and skips comments and hex colors", () => {
    const css = `
      /* .commented-class #ignored-id */
      .header-nav .nav-dropdown,
      #main-header {
        color: #fff;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
      }
    `

    expect(extractCssSelectors(css)).toEqual([
      "#main-header",
      ".header-nav",
      ".nav-dropdown",
    ])
  })

  it("includes .nav-dropdown from the header dropdown snippet", async () => {
    const content = await loadAndValidate()
    const snippet = content.snippets.find(
      (item) => item.slug === "header-dropdown-shadow"
    )

    expect(snippet).toBeDefined()
    expect(extractCssSelectors(snippet?.css ?? "")).toContain(".nav-dropdown")
  })
})

describe("buildSearchIndex", () => {
  it("indexes plugins, snippets, and categories with selector and dependency keywords", async () => {
    const content = await loadAndValidate()
    const index = buildSearchIndex(content)

    const plugin = index.find(
      (record) => record.slug === "blogg-post-plugin-for-flatsome"
    )
    expect(plugin).toMatchObject({
      type: "plugin",
      url: "/plugins/blogg-post-plugin-for-flatsome",
    })
    expect(plugin?.keywords).toEqual(
      expect.arrayContaining(["Advanced Custom Fields", "Polylang", "polylang"])
    )

    const snippet = index.find(
      (record) => record.slug === "header-dropdown-shadow"
    )
    expect(snippet).toMatchObject({
      type: "snippet",
      url: "/css/header-dropdown-shadow",
      category: "header",
    })
    expect(snippet?.keywords).toContain(".nav-dropdown")

    const category = index.find(
      (record) => record.type === "category" && record.slug === "header"
    )
    expect(category).toMatchObject({
      title: "Header",
      url: "/css/category/header",
    })

    const subcategory = index.find(
      (record) => record.slug === "header/dropdown-menus"
    )
    expect(subcategory).toMatchObject({
      type: "category",
      url: "/css/category/header/dropdown-menus",
    })
  })
})
