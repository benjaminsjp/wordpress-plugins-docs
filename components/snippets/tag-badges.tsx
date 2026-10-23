import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export function TagBadges({
  tags,
}: {
  tags: Array<{ slug: string; label: string }>
}) {
  if (tags.length === 0) {
    return null
  }

  return (
    <>
      {tags.map((tag) => (
        <Badge
          key={tag.slug}
          variant="secondary"
          render={<Link href={`/css/tag/${tag.slug}`} />}
        >
          {tag.label}
        </Badge>
      ))}
    </>
  )
}
