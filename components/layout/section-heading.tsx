import { headingId } from "@/lib/plugin-view"

export function SectionHeading({ children }: { children: string }) {
  return (
    <h2
      id={headingId(children)}
      className="font-heading scroll-mt-24 text-2xl font-semibold tracking-tight"
    >
      {children}
    </h2>
  )
}
