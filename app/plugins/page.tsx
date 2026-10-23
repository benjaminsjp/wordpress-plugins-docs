import type { Metadata } from "next"
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
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
    <PageShell>
      <PageBreadcrumbs
        items={[
          { label: strings.nav.home, href: "/" },
          { label: strings.nav.plugins },
        ]}
      />
      <PageHeader
        title={strings.plugins.title}
        description={strings.plugins.description}
      />
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
  )
}
