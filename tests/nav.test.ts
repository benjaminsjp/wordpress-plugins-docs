import { describe, expect, it } from "vitest"
import { breadcrumbTrail, type NavData } from "@/lib/nav"

const nav: NavData = {
  plugins: [
    {
      slug: "blogg-post-plugin-for-flatsome",
      name: "Blogg filter (ACF + Polylang)",
      href: "/plugins/blogg-post-plugin-for-flatsome",
    },
  ],
  snippets: [{ slug: "header-nav", name: "Header-navigasjon", href: "/css/header-nav" }],
  tags: [{ slug: "responsiv", label: "Responsiv", href: "/css/tag/responsiv" }],
  categories: [
    {
      slug: "header",
      label: "Header",
      href: "/css/category/header",
      count: 1,
      subcategories: [
        {
          slug: "navigasjon",
          label: "Navigasjon",
          href: "/css/category/header/navigasjon",
          count: 1,
        },
      ],
    },
  ],
  snippetLocations: {
    "header-nav": { category: "header", subcategory: "navigasjon" },
  },
  pluginCount: 1,
  snippetCount: 1,
}

describe("breadcrumbTrail", () => {
  it("builds trails for plugins, snippets, and taxonomy pages", () => {
    expect(breadcrumbTrail("/", nav).map((item) => item.label)).toEqual(["Hjem"])
    expect(
      breadcrumbTrail("/plugins/blogg-post-plugin-for-flatsome", nav).map(
        (item) => item.label
      )
    ).toEqual(["Hjem", "Plugins", "Blogg filter (ACF + Polylang)"])
    expect(breadcrumbTrail("/css/header-nav", nav).map((item) => item.label)).toEqual([
      "Hjem",
      "CSS-snippets",
      "Header",
      "Navigasjon",
      "Header-navigasjon",
    ])
    expect(breadcrumbTrail("/css/tag/responsiv", nav).map((item) => item.label)).toEqual([
      "Hjem",
      "CSS-snippets",
      "Responsiv",
    ])
  })
})
