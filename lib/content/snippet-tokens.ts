import type { SnippetToken } from "./schemas"

export function normalizeTokenValue(value: string, fallback: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return fallback
  }
  if (trimmed.startsWith("--") && !trimmed.includes("(")) {
    return `var(${trimmed})`
  }
  return trimmed
}

export function applySnippetTokens(
  css: string,
  tokens: SnippetToken[],
  values: Record<string, string>
): string {
  const ordered = [...tokens].sort(
    (left, right) => right.replace.length - left.replace.length
  )
  let result = css
  for (const token of ordered) {
    const next = normalizeTokenValue(values[token.id] ?? "", token.replace)
    result = result.split(token.replace).join(next)
  }
  return result
}

export function parseHexColor(value: string): string | null {
  const trimmed = value.trim()
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed)
  if (short?.[1]) {
    const [r, g, b] = short[1]
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }
  const long = /^#([0-9a-f]{6})$/i.exec(trimmed)
  return long?.[1] ? `#${long[1].toLowerCase()}` : null
}
