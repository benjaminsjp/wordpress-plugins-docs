"use client"

import { useId, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockFooter,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block"
import { strings } from "@/lib/strings"

const COLLAPSE_AFTER_LINES = 30

export function SnippetCodeView({
  code,
  lines,
}: {
  code: string
  lines: ReactNode[]
}) {
  const id = useId()
  const collapsible = code.split("\n").length > COLLAPSE_AFTER_LINES
  const [expanded, setExpanded] = useState(!collapsible)

  return (
    <CodeBlock>
      <CodeBlockHeader>
        <CodeBlockTitle>snippet.css</CodeBlockTitle>
        <CodeBlockActions>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent
        id={id}
        lineNumbers
        className={
          collapsible && !expanded
            ? "max-h-96 overflow-y-hidden scroll-fade-y"
            : undefined
        }
      >
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
      {collapsible ? (
        <CodeBlockFooter className="justify-center">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            aria-expanded={expanded}
            aria-controls={id}
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? strings.code.showLess : strings.code.showAll}
          </Button>
        </CodeBlockFooter>
      ) : null}
    </CodeBlock>
  )
}
