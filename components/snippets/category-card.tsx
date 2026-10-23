import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { strings } from "@/lib/strings"

export function CategoryCard({
  href,
  label,
  count,
}: {
  href: string
  label: string
  count: number
}) {
  const filled = count > 0

  return (
    <Link href={href} className="block h-full">
      <Card className="h-full border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <CardDescription>
            {strings.home.snippetCountInCategory(count)}
          </CardDescription>
          <CardAction>
            <Badge variant={filled ? "default" : "secondary"}>{count}</Badge>
          </CardAction>
        </CardHeader>
      </Card>
    </Link>
  )
}
