import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function PluginMediaFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "relative block aspect-video overflow-hidden bg-background",
        className
      )}
    >
      {children}
    </span>
  )
}
