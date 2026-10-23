import type { ReactNode } from "react"

export function MdxProse({ children }: { children: ReactNode }) {
  return <div className="mdx-content flex flex-col gap-4">{children}</div>
}
