import { loadPlugins } from "./load-plugins"
import { getContentPaths } from "./paths"
import { selectLatestRelease } from "./versions"
import type { ReleaseChannel, VersionScheme } from "./schemas"

export type LatestZipPlugin = {
  slug: string
  versionScheme: VersionScheme
  releases: Array<{
    version: string
    channel: ReleaseChannel
    yanked?: { reason: string } | null
    resolved: {
      downloadUrl: string
      extras?: Array<{ id: string; downloadUrl: string }>
    }
  }>
}

export type LatestZipRedirect = {
  source: string
  destination: string
  permanent: false
}

export function latestZipPath(slug: string): string {
  return `/plugins/${slug}/latest.zip`
}

export function latestExtraZipPath(slug: string, id: string): string {
  return `/plugins/${slug}/latest-${id}.zip`
}

export function latestZipRedirectsFromPlugins(
  plugins: LatestZipPlugin[]
): LatestZipRedirect[] {
  const redirects: LatestZipRedirect[] = []

  for (const plugin of plugins) {
    const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
    if (!latest) continue

    redirects.push({
      source: latestZipPath(plugin.slug),
      destination: latest.resolved.downloadUrl,
      permanent: false,
    })

    for (const extra of latest.resolved.extras ?? []) {
      redirects.push({
        source: latestExtraZipPath(plugin.slug, extra.id),
        destination: extra.downloadUrl,
        permanent: false,
      })
    }
  }

  return redirects
}

export async function getLatestZipRedirects(): Promise<LatestZipRedirect[]> {
  const { plugins } = await loadPlugins(getContentPaths())
  return latestZipRedirectsFromPlugins(plugins)
}
