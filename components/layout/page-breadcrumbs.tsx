import { Fragment } from "react"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

export type BreadcrumbEntry = {
  label: string
  href?: string
}

function Crumb({
  item,
  isLast,
  className,
}: {
  item: BreadcrumbEntry
  isLast?: boolean
  className?: string
}) {
  return (
    <BreadcrumbItem className={cn(isLast && "min-w-0 flex-1", className)}>
      {isLast || !item.href ? (
        <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
      ) : (
        <BreadcrumbLink className="truncate" render={<Link href={item.href} />}>
          {item.label}
        </BreadcrumbLink>
      )}
    </BreadcrumbItem>
  )
}

export function PageBreadcrumbs({ items }: { items: BreadcrumbEntry[] }) {
  const lastIndex = items.length - 1
  const collapseMiddle = items.length > 2

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {items.map((item, index) => {
          const isLast = index === lastIndex
          const isMiddle = index > 0 && !isLast

          return (
            <Fragment key={`${item.label}-${index}`}>
              {index === 1 && collapseMiddle ? (
                <>
                  <BreadcrumbSeparator className="sm:hidden" />
                  <BreadcrumbItem className="sm:hidden">
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                </>
              ) : null}
              {index > 0 ? (
                <BreadcrumbSeparator
                  className={cn(isMiddle && "max-sm:hidden")}
                />
              ) : null}
              <Crumb
                item={item}
                isLast={isLast}
                className={isMiddle ? "max-sm:hidden" : undefined}
              />
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
