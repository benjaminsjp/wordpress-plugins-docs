import type { Metadata } from "next"
import { PageHero } from "@/components/layout/page-hero"
import { PageShell } from "@/components/layout/page-shell"
import { PluginGrid } from "@/components/plugins/plugin-grid"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getPlugins, getTaxonomy } from "@/lib/content"
import { strings } from "@/lib/strings"
import { BlocksIcon } from "lucide-react"

export const metadata: Metadata = {
  title: strings.plugins.title,
}

function authorLabelMap(
  authors: Array<{ slug: string; label: string }> | undefined
): Record<string, string> {
  const map: Record<string, string> = {}
  for (const author of authors ?? []) {
    map[author.slug] = author.label
  }
  return map
}

export default async function PluginsPage() {
  const [pluginsRaw, taxonomy] = await Promise.all([
    getPlugins(),
    getTaxonomy(),
  ])
  const plugins = [...pluginsRaw].sort((left, right) =>
    left.name.localeCompare(right.name, "nb")
  )
  const authorLabels = authorLabelMap(taxonomy?.authors)

  return (
    <>
      <PageHero
        title={strings.plugins.title}
        description={strings.plugins.description}
      />
      <PageShell>
        {plugins.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BlocksIcon />
              </EmptyMedia>
              <EmptyTitle>{strings.plugins.emptyTitle}</EmptyTitle>
              <EmptyDescription>
                {strings.plugins.emptyDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <PluginGrid plugins={plugins} authorLabels={authorLabels} />
        )}
      </PageShell>
    </>
  )
}
