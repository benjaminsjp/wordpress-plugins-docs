import { describe, expect, it } from "vitest"
import {
  applySnippetTokens,
  normalizeTokenValue,
  parseHexColor,
} from "@/lib/content/snippet-tokens"
import { loadAndValidate } from "@/lib/content/validate"

const tokens = [
  {
    id: "primary",
    label: "Primærfarge",
    replace: "var(--fs-color-primary)",
  },
  {
    id: "secondary",
    label: "Sekundærfarge",
    replace: "var(--fs-color-secondary)",
  },
]

describe("normalizeTokenValue", () => {
  it("wraps bare custom properties in var()", () => {
    expect(normalizeTokenValue(" --brand ", "var(--fs-color-primary)")).toBe(
      "var(--brand)"
    )
  })

  it("keeps var() and hex values", () => {
    expect(normalizeTokenValue("var(--x)", "fallback")).toBe("var(--x)")
    expect(normalizeTokenValue("#446688", "fallback")).toBe("#446688")
  })

  it("falls back when empty", () => {
    expect(normalizeTokenValue("  ", "var(--fs-color-primary)")).toBe(
      "var(--fs-color-primary)"
    )
  })
})

describe("applySnippetTokens", () => {
  it("replaces longer tokens first", () => {
    const css =
      "color: var(--fs-color-primary); accent: var(--fs-color-secondary);"
    expect(
      applySnippetTokens(css, tokens, {
        primary: "#111111",
        secondary: "--brand-2",
      })
    ).toBe("color: #111111; accent: var(--brand-2);")
  })
})

describe("parseHexColor", () => {
  it("expands 3-digit hex", () => {
    expect(parseHexColor("#0af")).toBe("#00aaff")
  })

  it("rejects CSS variables", () => {
    expect(parseHexColor("var(--fs-color-primary)")).toBeNull()
  })
})

describe("gravity-forms tokens", () => {
  it("match strings in the snippet CSS", async () => {
    const result = await loadAndValidate()
    const snippet = result.snippets.find(
      (item) => item.slug === "gravity-forms-styling"
    )
    expect(snippet?.tokens?.map((token) => token.id)).toEqual([
      "primary",
      "secondary",
    ])
    expect(
      result.issues.filter((issue) =>
        issue.code.startsWith("snippet-token")
      )
    ).toEqual([])
    expect(snippet?.css.includes("var(--fs-color-primary-gray)")).toBe(false)
    expect(snippet?.css.includes(".kk-input")).toBe(false)
    expect(snippet?.css.includes(".kk-label")).toBe(false)
  })
})
