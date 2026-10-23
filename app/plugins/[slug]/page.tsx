import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"
import { PageHero } from "@/components/layout/page-hero"
import { PageShell } from "@/components/layout/page-shell"
import { PluginAlerts } from "@/components/plugins/plugin-alerts"
import { PluginBadges } from "@/components/plugins/plugin-badges"
import { PluginDocs } from "@/components/plugins/plugin-docs"
import { DependencyTable } from "@/components/plugins/dependency-table"
import { DependentsList } from "@/components/plugins/dependents-list"
import { DownloadButton } from "@/components/plugins/download-button"
import { RelatedItems } from "@/components/plugins/related-items"
import { ReleaseTable } from "@/components/plugins/release-table"
import { RequirementsList } from "@/components/plugins/requirements-list"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { getPlugin, getPluginGraph, getPlugins, getSnippets } from "@/lib/content"
import { repositoryUrl } from "@/lib/content/github"
import { latestZipPath } from "@/lib/content/latest-zip"
import { selectLatestRelease } from "@/lib/content/versions"
import { formatDate } from "@/lib/format"
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
    <>
      <PageHero
        title={plugin.name}
        description={plugin.summary}
        eyebrow={<PluginBadges plugin={plugin} version={latest?.version} />}
      >
        <div className="flex w-full flex-col gap-2 md:w-56">
          {latest ? (
            <DownloadButton
              href={latestZipPath(plugin.slug)}
              className="w-full"
            />
          ) : null}
          <Button
            variant="outline"
            size="lg"
            className="w-full"
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
          {latest ? (
            <p className="text-center text-sm text-muted-foreground">
              {strings.plugins.updatedOn(formatDate(latest.releaseDate))}
            </p>
          ) : null}
        </div>
      </PageHero>
      <PageShell>
        <PluginAlerts
          plugin={plugin}
          latest={latest}
          replacedByName={replacedBy?.name}
        />
        {latest ? (
          <>
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {strings.plugins.requirements}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {strings.plugins.requirementsIntro}
                </p>
              </div>
              <RequirementsList release={latest} />
            </section>
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="font-heading text-2xl font-semibold tracking-tight">
                  {strings.plugins.dependencies}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {strings.plugins.dependenciesIntro}
                </p>
              </div>
              <DependencyTable release={latest} plugins={plugins} />
              <Alert>
                <AlertDescription>{strings.plugins.manualUpdate}</AlertDescription>
              </Alert>
            </section>
          </>
        ) : null}
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            {strings.plugins.usedBy}
          </h2>
          <DependentsList slugs={dependents} plugins={plugins} />
        </section>
        <PluginDocs slug={plugin.slug} />
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
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
    </>
  )
}
