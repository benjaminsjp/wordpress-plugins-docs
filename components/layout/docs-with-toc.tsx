import type { ReactNode } from "react"
import { OnThisPage } from "@/components/layout/on-this-page"
import type { TocItem } from "@/lib/toc"

export function DocsWithToc({
  items,
  children,
}: {
  items: TocItem[]
  children: ReactNode
}) {
  const showToc = items.length >= 2

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1100px] gap-8 px-6 py-8">
      <div className="flex min-w-0 flex-1 flex-col gap-8">{children}</div>
      {showToc ? (
        <aside className="hidden w-[250px] shrink-0 xl:block">
          <div className="sticky top-20 max-h-[calc(100vh-5.5rem)] overflow-y-auto">
            <OnThisPage items={items} />
          </div>
        </aside>
      ) : null}
    </div>
  )
}
