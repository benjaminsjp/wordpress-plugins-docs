import type { ReactNode } from "react"
import { PageHeader } from "@/components/layout/page-header"
import { cn } from "@/lib/utils"

export function PageHero({
  title,
  description,
  eyebrow,
  children,
  media,
}: {
  title: string
  description?: string
  eyebrow?: ReactNode
  children?: ReactNode
  media?: ReactNode
}) {
  return (
    <div className="border-b bg-muted">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1100px] min-w-0 flex-col gap-6 px-6 py-8",
          media ? "md:flex-row md:items-start md:justify-between" : null
        )}
      >
        {media ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <PageHeader
                title={title}
                description={description}
                eyebrow={eyebrow}
              />
              {children}
            </div>
            <div className="w-full shrink-0 md:max-w-sm xl:max-w-md">{media}</div>
          </>
        ) : (
          <PageHeader title={title} description={description} eyebrow={eyebrow}>
            {children}
          </PageHeader>
        )}
      </div>
    </div>
  )
}
