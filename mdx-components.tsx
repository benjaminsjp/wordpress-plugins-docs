import type { MDXComponents } from "mdx/types"
import Link from "next/link"
import { Children, isValidElement, type ReactNode } from "react"
import { CodeBlock } from "@/components/code/code-block"
import { Callout } from "@/components/mdx/callout"
import { languageFromClassName } from "@/lib/highlight"

function MdxLink({
  href,
  children,
}: {
  href?: string
  children?: ReactNode
}) {
  if (href?.startsWith("/")) {
    return <Link href={href}>{children}</Link>
  }

  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

async function MdxPre({ children }: { children?: ReactNode }) {
  const child = Children.toArray(children)[0]
  if (
    isValidElement<{ className?: string; children?: ReactNode }>(child)
  ) {
    const language = languageFromClassName(child.props.className)
    const code = String(child.props.children ?? "").replace(/\n$/, "")
    return <CodeBlock code={code} language={language} />
  }

  return <CodeBlock code={String(children ?? "")} />
}

const components: MDXComponents = {
  a: MdxLink,
  pre: MdxPre,
  Callout,
}

export function useMDXComponents(): MDXComponents {
  return components
}
