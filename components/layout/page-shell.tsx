import type { ReactNode } from "react"

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-w-0 w-full max-w-[1100px] flex-1 flex-col gap-8 px-6 py-8">
      {children}
    </div>
  )
}
