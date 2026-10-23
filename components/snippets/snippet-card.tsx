import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { SnippetRecord } from "@/lib/content/load-snippets"

export function SnippetCard({
  snippet,
  categoryLabel,
}: {
  snippet: SnippetRecord
  categoryLabel?: string
}) {
  return (
    <Link href={`/css/${snippet.slug}`} className="block h-full">
      <Card className="h-full border-t-2 border-t-chart-3 transition-colors hover:bg-muted/40">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{snippet.name}</CardTitle>
            {categoryLabel ? (
              <Badge variant="outline">{categoryLabel}</Badge>
            ) : null}
          </div>
          <CardDescription>{snippet.summary}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
