import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"
import { PageBreadcrumbs } from "@/components/layout/page-breadcrumbs"
import { PageHeader } from "@/components/layout/page-header"
import { PageShell } from "@/components/layout/page-shell"
import { PluginAlerts } from "@/components/plugins/plugin-alerts"
import { PluginDocs } from "@/components/plugins/plugin-docs"
import { DependencyTable } from "@/components/plugins/dependency-table"
import { DependentsList } from "@/components/plugins/dependents-list"
import { DownloadButton } from "@/components/plugins/download-button"
import { RelatedItems } from "@/components/plugins/related-items"
import { ReleaseTable } from "@/components/plugins/release-table"
import { RequirementsList } from "@/components/plugins/requirements-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getPlugin, getPluginGraph, getPlugins, getSnippets } from "@/lib/content"
import { repositoryUrl } from "@/lib/content/github"
import { selectLatestRelease } from "@/lib/content/versions"
import { strings } from "@/lib/strings"

export const dynamicParams = false

export async function generateStaticParams() {
  const plugins = await getPlugins()
  return plugins.map((plugin) => ({ slug: plugin.slug }))
}

type PluginPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PluginPageProps): Promise<Metadata> {
  const { slug } = await params
  const plugin = await getPlugin(slug)
  if (!plugin) {
    return { title: strings.notFound.title }
  }
  return { title: plugin.name, description: plugin.summary }
}

export default async function PluginPage({
  params,
}: PluginPageProps) {
  const { slug } = await params
  const [plugin, plugins, snippets, graph] = await Promise.all([
    getPlugin(slug),
    getPlugins(),
    getSnippets(),
    getPluginGraph(),
  ])

  if (!plugin) {
    notFound()
  }

  const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
  const replacedBy = plugin.replacedBy
    ? plugins.find((item) => item.slug === plugin.replacedBy)
    : undefined
  const dependents = graph.dependents.get(plugin.slug) ?? []

  return (
    <PageShell>
      <PageBreadcrumbs
        items={[
          { label: strings.nav.home, href: "/" },
          { label: strings.nav.plugins, href: "/plugins" },
          { label: plugin.name },
        ]}
      />
      <PageHeader title={plugin.name} description={plugin.summary}>
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {latest ? (
              <Badge variant="secondary">{strings.version(latest.version)}</Badge>
            ) : null}
            <Badge variant="outline">{strings.status[plugin.status]}</Badge>
            <Badge variant="outline">
              {strings.plugins.visibility[plugin.repository.visibility]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {latest ? (
              <DownloadButton
                href={latest.resolved.downloadUrl}
                version={latest.version}
              />
            ) : null}
            <Button
              variant="outline"
              render={
                <a
                  href={repositoryUrl(
                    plugin.repository.owner,
                    plugin.repository.repo
                  )}
                  target="_blank"
                  rel="noreferrer"
                />
              }
              nativeButton={false}
            >
              <ExternalLinkIcon data-icon="inline-start" />
              {strings.plugins.viewOnGitHub}
            </Button>
          </div>
        </div>
      </PageHeader>
      <PluginAlerts
        plugin={plugin}
        latest={latest}
        replacedByName={replacedBy?.name}
      />
      {latest ? (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">
              {strings.plugins.requirements}
            </h2>
            <RequirementsList release={latest} />
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="font-heading text-xl font-medium">
              {strings.plugins.dependencies}
            </h2>
            <DependencyTable release={latest} plugins={plugins} />
          </section>
        </>
      ) : null}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">
          {strings.plugins.usedBy}
        </h2>
        <DependentsList slugs={dependents} plugins={plugins} />
      </section>
      <PluginDocs slug={plugin.slug} />
      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-medium">
          {strings.plugins.versions}
        </h2>
        {plugin.releases.length === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>{strings.plugins.noReleasesTitle}</EmptyTitle>
              <EmptyDescription>
                {strings.plugins.noReleasesDescription}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ReleaseTable plugin={plugin} />
        )}
      </section>
      <RelatedItems plugin={plugin} plugins={plugins} snippets={snippets} />
    </PageShell>
  )
}
