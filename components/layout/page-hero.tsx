import type { ReactNode } from "react"
import { PageHeader } from "@/components/layout/page-header"

export function PageHero({
  title,
  description,
  eyebrow,
  children,
}: {
  title: string
  description?: string
  eyebrow?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="border-b bg-muted">
      <div className="mx-auto flex w-full max-w-[1100px] min-w-0 flex-col gap-4 px-6 py-8">
        <PageHeader title={title} description={description} eyebrow={eyebrow}>
          {children}
        </PageHeader>
      </div>
    </div>
  )
}
