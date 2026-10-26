import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ExternalLinkIcon } from "lucide-react"
import { DocsWithToc } from "@/components/layout/docs-with-toc"
import { PageHero } from "@/components/layout/page-hero"
import { SectionHeading } from "@/components/layout/section-heading"
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
import {
  getPlugin,
  getPluginGraph,
  getPlugins,
  getSnippets,
  getTaxonomy,
} from "@/lib/content"
import { repositoryUrl } from "@/lib/content/github"
import { latestZipPath } from "@/lib/content/latest-zip"
import { extractMdxHeadings } from "@/lib/content/mdx-headings"
import { readPluginDocSource } from "@/lib/content/load-mdx"
import { buildPluginToc } from "@/lib/toc"
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
  const [plugin, plugins, snippets, graph, taxonomy, overviewSource, usageSource] =
    await Promise.all([
      getPlugin(slug),
      getPlugins(),
      getSnippets(),
      getPluginGraph(),
      getTaxonomy(),
      readPluginDocSource(slug, "overview"),
      readPluginDocSource(slug, "usage"),
    ])

  if (!plugin) {
    notFound()
  }

  const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
  const authorLabel = taxonomy?.authors.find(
    (author) => author.slug === plugin.author
  )?.label
  const replacedBy = plugin.replacedBy
    ? plugins.find((item) => item.slug === plugin.replacedBy)
    : undefined
  const dependents = graph.dependents.get(plugin.slug) ?? []
  const toc = buildPluginToc({
    hasLatest: Boolean(latest),
    hasOverview: overviewSource !== null,
    hasUsage: usageSource !== null,
    hasRelated:
      (plugin.related?.plugins?.length ?? 0) > 0 ||
      (plugin.related?.snippets?.length ?? 0) > 0,
    usageHeadings: usageSource ? extractMdxHeadings(usageSource) : [],
  })

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
          {authorLabel ? (
            <p className="text-center text-sm text-muted-foreground">
              {strings.plugins.authorLabel}: {authorLabel}
            </p>
          ) : null}
          {latest ? (
            <p className="text-center text-sm text-muted-foreground">
              {strings.plugins.updatedOn(formatDate(latest.releaseDate))}
            </p>
          ) : null}
        </div>
      </PageHero>
      <DocsWithToc items={toc}>
          <PluginAlerts
            plugin={plugin}
            latest={latest}
            replacedByName={replacedBy?.name}
          />
          {latest ? (
            <>
              <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <SectionHeading>{strings.plugins.requirements}</SectionHeading>
                  <p className="text-sm text-muted-foreground">
                    {strings.plugins.requirementsIntro}
                  </p>
                </div>
                <RequirementsList release={latest} />
              </section>
              <section className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <SectionHeading>{strings.plugins.dependencies}</SectionHeading>
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
            <SectionHeading>{strings.plugins.usedBy}</SectionHeading>
            <DependentsList slugs={dependents} plugins={plugins} />
          </section>
          <PluginDocs slug={plugin.slug} />
          <section className="flex flex-col gap-4">
            <SectionHeading>{strings.plugins.versions}</SectionHeading>
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
      </DocsWithToc>
    </>
  )
}
