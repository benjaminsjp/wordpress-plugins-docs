import { compareVersions } from "@/lib/content/versions"
import type { VersionScheme } from "@/lib/content/schemas"
import type { ReleaseRecord } from "@/lib/content/load-plugins"

export function versionAnchor(version: string): string {
  return `v${version.replace(/[^0-9A-Za-z]+/g, "-").replace(/-+$/g, "")}`
}

export function headingId(text: string): string {
  return text
    .trim()
    .replace(/[æÆ]/g, "ae")
    .replace(/[øØ]/g, "o")
    .replace(/[åÅ]/g, "a")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function sortReleasesNewestFirst(
  releases: ReleaseRecord[],
  scheme: VersionScheme
): ReleaseRecord[] {
  return [...releases].sort((left, right) =>
    compareVersions(right.version, left.version, scheme)
  )
}

export function changelogFileUrl(
  plugin: { changelogUrl?: string },
  release: { changelog?: { url?: string } | null }
): string | undefined {
  return release.changelog?.url ?? plugin.changelogUrl
}

export function minVersionSatisfied(
  latestVersion: string | undefined,
  minVersion: string | undefined,
  scheme: VersionScheme
): boolean | null {
  if (!minVersion || !latestVersion) {
    return null
  }

  return compareVersions(latestVersion, minVersion, scheme) >= 0
}
