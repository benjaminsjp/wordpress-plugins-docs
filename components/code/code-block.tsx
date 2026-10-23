import { CodeBlockFrame } from "@/components/code/code-block-frame"
import { highlightCode } from "@/lib/highlight"

export async function CodeBlock({
  code,
  language = "text",
}: {
  code: string
  language?: string
}) {
  const html = await highlightCode(code, language)

  return <CodeBlockFrame html={html} code={code} />
}
