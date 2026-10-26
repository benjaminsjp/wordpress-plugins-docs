"use client"

import { useMemo, useState, type ReactNode } from "react"
import { SnippetCodeView } from "@/components/snippets/snippet-code-view"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { applySnippetTokens, parseHexColor } from "@/lib/content/snippet-tokens"
import type { SnippetToken } from "@/lib/content/schemas"
import { strings } from "@/lib/strings"
import { useHighlightedCode } from "@/hooks/use-highlighted-code"

export function SnippetCodeEditor({
  code,
  tokens,
  defaultLines,
}: {
  code: string
  tokens: SnippetToken[]
  defaultLines: ReactNode[]
}) {
  const defaults = useMemo(
    () => Object.fromEntries(tokens.map((token) => [token.id, token.replace])),
    [tokens]
  )
  const [values, setValues] = useState<Record<string, string>>(defaults)

  const customized = applySnippetTokens(code, tokens, values)
  const isDefault = customized === code

  return (
    <div className="flex flex-col gap-4">
      <FieldSet>
        <FieldLegend>{strings.snippets.tokenFields}</FieldLegend>
        <FieldDescription>{strings.snippets.tokenHint}</FieldDescription>
        <FieldGroup className="gap-4">
          {tokens.map((token) => {
            const fieldId = `snippet-token-${token.id}`
            const hex = parseHexColor(values[token.id] ?? "")
            return (
              <Field key={token.id}>
                <FieldLabel htmlFor={fieldId}>{token.label}</FieldLabel>
                <InputGroup>
                  <InputGroupAddon align="inline-start">
                    <input
                      type="color"
                      aria-label={strings.snippets.tokenColor(token.label)}
                      value={hex ?? "#000000"}
                      className="size-6 cursor-pointer appearance-none rounded-full border bg-transparent p-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        setValues((current) => ({
                          ...current,
                          [token.id]: event.target.value,
                        }))
                      }}
                    />
                  </InputGroupAddon>
                  <InputGroupInput
                    id={fieldId}
                    value={values[token.id] ?? token.replace}
                    spellCheck={false}
                    onChange={(event) => {
                      setValues((current) => ({
                        ...current,
                        [token.id]: event.target.value,
                      }))
                    }}
                  />
                </InputGroup>
              </Field>
            )
          })}
        </FieldGroup>
        {isDefault ? null : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => setValues(defaults)}
          >
            {strings.snippets.tokenReset}
          </Button>
        )}
      </FieldSet>
      {isDefault ? (
        <SnippetCodeView code={code} lines={defaultLines} />
      ) : (
        <SnippetLiveCode code={customized} />
      )}
    </div>
  )
}

function SnippetLiveCode({ code }: { code: string }) {
  const lines = useHighlightedCode(code, "css")
  return <SnippetCodeView code={code} lines={lines} />
}
