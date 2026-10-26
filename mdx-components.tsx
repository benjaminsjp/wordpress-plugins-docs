import type { MDXComponents } from "mdx/types"
import Link from "next/link"
import { Children, isValidElement, type ReactNode } from "react"
import { CodeBlock } from "@/components/code/code-block"
import { Callout } from "@/components/mdx/callout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { languageFromClassName } from "@/lib/highlight"
import { headingId } from "@/lib/plugin-view"

function nodeText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") {
    return ""
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(nodeText).join("")
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return nodeText(node.props.children)
  }
  return ""
}

function MdxHeading({
  as: Tag,
  children,
}: {
  as: "h2" | "h3"
  children?: ReactNode
}) {
  const id = headingId(nodeText(children))
  return (
    <Tag id={id || undefined} className="scroll-mt-24">
      {children}
    </Tag>
  )
}

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
  h2: ({ children }) => <MdxHeading as="h2">{children}</MdxHeading>,
  h3: ({ children }) => <MdxHeading as="h3">{children}</MdxHeading>,
  table: Table,
  thead: TableHeader,
  tbody: TableBody,
  tr: TableRow,
  th: TableHead,
  td: TableCell,
  Callout,
}

export function useMDXComponents(): MDXComponents {
  return components
}
