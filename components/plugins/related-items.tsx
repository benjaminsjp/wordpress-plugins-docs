import Link from "next/link"
import type { PluginRecord } from "@/lib/content/load-plugins"
import type { SnippetRecord } from "@/lib/content/load-snippets"
import { strings } from "@/lib/strings"

export function RelatedItems({
  plugin,
  plugins,
  snippets,
}: {
  plugin: PluginRecord
  plugins: PluginRecord[]
  snippets: SnippetRecord[]
}) {
  const relatedPlugins = (plugin.related?.plugins ?? [])
    .map((slug) => plugins.find((item) => item.slug === slug))
    .filter((item) => item !== undefined)
  const relatedSnippets = (plugin.related?.snippets ?? [])
    .map((slug) => snippets.find((item) => item.slug === slug))
    .filter((item) => item !== undefined)

  if (relatedPlugins.length === 0 && relatedSnippets.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        {strings.plugins.related}
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
      {relatedPlugins.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-base font-medium">
            {strings.plugins.relatedPlugins}
          </h3>
          <ul className="flex flex-col gap-2">
            {relatedPlugins.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/plugins/${item.slug}`}
                  className="underline-offset-3 hover:underline"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {relatedSnippets.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3 className="font-heading text-base font-medium">
            {strings.plugins.relatedSnippets}
          </h3>
          <ul className="flex flex-col gap-2">
            {relatedSnippets.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/css/${item.slug}`}
                  className="underline-offset-3 hover:underline"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      </div>
    </section>
  )
}
