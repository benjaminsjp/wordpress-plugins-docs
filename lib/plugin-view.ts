import { compareVersions } from "@/lib/content/versions"
import type { VersionScheme } from "@/lib/content/schemas"
import type { ReleaseRecord } from "@/lib/content/load-plugins"

export function versionAnchor(version: string): string {
  return `v${version.replace(/[^0-9A-Za-z]+/g, "-").replace(/-+$/g, "")}`
}

export function sortReleasesNewestFirst(
  releases: ReleaseRecord[],
  scheme: VersionScheme
): ReleaseRecord[] {
  return [...releases].sort((left, right) =>
    compareVersions(right.version, left.version, scheme)
  )
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
