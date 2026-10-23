"use client"

import { useState } from "react"
import { CopyButton } from "@/components/code/copy-button"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { strings } from "@/lib/strings"

const COLLAPSE_AFTER_LINES = 30

export function CodeBlockFrame({
  html,
  code,
}: {
  html: string
  code: string
}) {
  const lineCount = code.split("\n").length
  const collapsible = lineCount > COLLAPSE_AFTER_LINES
  const [expanded, setExpanded] = useState(!collapsible)

  return (
    <div className="relative min-w-0 max-w-full overflow-hidden rounded-xl border bg-muted/30">
      <div className="absolute top-2 right-2 z-10">
        <CopyButton text={code} />
      </div>
      <div
        tabIndex={0}
        aria-label={strings.code.scrollLabel}
        className={cn(
          "min-w-0 overflow-x-auto p-4 text-sm focus-visible:ring-3 focus-visible:ring-ring/30 [&_pre]:m-0 [&_pre]:bg-transparent! [&_pre]:whitespace-pre [&_code]:font-mono",
          collapsible && !expanded && "max-h-96 overflow-y-hidden"
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {collapsible ? (
        <div className="flex justify-center border-t p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((current) => !current)}
          >
            {expanded ? strings.code.showLess : strings.code.showAll}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
