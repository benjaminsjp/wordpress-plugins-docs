import { SnippetCodeEditor } from "@/components/snippets/snippet-code-editor"
import { SnippetCodeView } from "@/components/snippets/snippet-code-view"
import { highlightCode } from "@/lib/highlighter"
import type { SnippetToken } from "@/lib/content/schemas"

export async function SnippetCode({
  code,
  tokens = [],
}: {
  code: string
  tokens?: SnippetToken[]
}) {
  const highlighted = await highlightCode(code, "css")
  const defaultLines = highlighted ?? code.replace(/\n$/, "").split("\n")

  if (tokens.length === 0) {
    return <SnippetCodeView code={code} lines={defaultLines} />
  }

  return (
    <SnippetCodeEditor
      code={code}
      tokens={tokens}
      defaultLines={defaultLines}
    />
  )
}
