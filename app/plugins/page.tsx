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
import { getPlugins } from "@/lib/content"
import { strings } from "@/lib/strings"
import { BlocksIcon } from "lucide-react"

export const metadata: Metadata = {
  title: strings.plugins.title,
}

export default async function PluginsPage() {
  const plugins = [...(await getPlugins())].sort((left, right) =>
    left.name.localeCompare(right.name, "nb")
  )

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
          <PluginGrid plugins={plugins} />
        )}
      </PageShell>
    </>
  )
}
