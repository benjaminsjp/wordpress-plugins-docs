import Link from "next/link"
import type { PluginRecord } from "@/lib/content/load-plugins"
import { strings } from "@/lib/strings"

export function DependentsList({
  slugs,
  plugins,
}: {
  slugs: string[]
  plugins: PluginRecord[]
}) {
  if (slugs.length === 0) {
    return <p className="text-muted-foreground">{strings.plugins.noDependents}</p>
  }

  const bySlug = new Map(plugins.map((plugin) => [plugin.slug, plugin]))

  return (
    <ul className="flex flex-col gap-2">
      {slugs.map((slug) => {
        const plugin = bySlug.get(slug)
        return (
          <li key={slug}>
            {plugin ? (
              <Link
                href={`/plugins/${plugin.slug}`}
                className="underline-offset-3 hover:underline"
              >
                {plugin.name}
              </Link>
            ) : (
              slug
            )}
          </li>
        )
      })}
    </ul>
  )
}
