import { createHighlighter, type Highlighter } from "shiki"

const LANGUAGE_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "javascript",
  sh: "bash",
  shell: "bash",
  text: "plaintext",
  txt: "plaintext",
}

const LOADED_LANGS = ["css", "php", "bash", "json", "javascript", "plaintext"] as const

let highlighterPromise: Promise<Highlighter> | undefined

function getHighlighter() {
  highlighterPromise ??= createHighlighter({
    themes: ["github-light", "github-dark"],
    langs: [...LOADED_LANGS],
  })
  return highlighterPromise
}

export async function highlightCode(code: string, language = "text") {
  const highlighter = await getHighlighter()
  const requested = LANGUAGE_ALIASES[language] ?? language
  const lang = (LOADED_LANGS as readonly string[]).includes(requested)
    ? requested
    : "plaintext"

  return highlighter.codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  })
}

export function languageFromClassName(className?: string) {
  const match = /language-([a-z0-9+-]+)/i.exec(className ?? "")
  return match?.[1]?.toLowerCase() ?? "text"
}
