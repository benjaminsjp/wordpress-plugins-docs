import type { ReleaseChannel, VersionScheme } from "./schemas"

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/

const DOTTED_PATTERN = /^(0|[1-9]\d*)(\.(0|[1-9]\d*)){1,3}$/

const CALVER_PATTERN = /^\d{4}\.(0[1-9]|1[0-2])(?:\.([1-9]\d*))?$/

export type ParsedVersion = {
  scheme: VersionScheme
  core: number[]
  prerelease: Array<string | number> | null
  canonical: string
}

export function hasLeadingV(version: string): boolean {
  return /^v/i.test(version)
}

export function parseVersion(
  version: string,
  scheme: VersionScheme
): ParsedVersion | null {
  if (hasLeadingV(version)) {
    return null
  }

  if (scheme === "semver") {
    const match = SEMVER_PATTERN.exec(version)
    if (!match) return null

    const core = [Number(match[1]), Number(match[2]), Number(match[3])]
    const prerelease = match[4] ? parsePrerelease(match[4]) : null
    const canonical = prerelease
      ? `${core.join(".")}-${match[4].toLowerCase()}`
      : core.join(".")

    return { scheme, core, prerelease, canonical }
  }

  if (scheme === "dotted") {
    if (!DOTTED_PATTERN.test(version)) return null
    const core = version.split(".").map(Number)
    return { scheme, core, prerelease: null, canonical: version }
  }

  const match = CALVER_PATTERN.exec(version)
  if (!match) return null

  const [year, month] = version.split(".").map(Number)
  const patch = match[2] ? Number(match[2]) : 0
  const core = [year, month, patch]
  return { scheme, core, prerelease: null, canonical: version }
}

export function isValidVersion(
  version: string,
  scheme: VersionScheme
): boolean {
  return parseVersion(version, scheme) !== null
}

export function compareVersions(
  left: string,
  right: string,
  scheme: VersionScheme
): number {
  const parsedLeft = parseVersion(left, scheme)
  const parsedRight = parseVersion(right, scheme)

  if (!parsedLeft || !parsedRight) {
    return left.localeCompare(right)
  }

  return compareParsedVersions(parsedLeft, parsedRight)
}

export function compareParsedVersions(
  left: ParsedVersion,
  right: ParsedVersion
): number {
  const length = Math.max(left.core.length, right.core.length)

  for (let index = 0; index < length; index += 1) {
    const leftValue = left.core[index] ?? 0
    const rightValue = right.core[index] ?? 0
    if (leftValue !== rightValue) {
      return leftValue < rightValue ? -1 : 1
    }
  }

  if (left.prerelease && !right.prerelease) return -1
  if (!left.prerelease && right.prerelease) return 1
  if (left.prerelease && right.prerelease) {
    return comparePrereleaseIdentifiers(left.prerelease, right.prerelease)
  }

  return 0
}

export type VersionedRelease = {
  version: string
  channel: ReleaseChannel
  yanked?: { reason: string } | null
}

export function selectLatestRelease<T extends VersionedRelease>(
  releases: T[],
  scheme: VersionScheme
): T | undefined {
  const notYanked = releases.filter((release) => !release.yanked)
  const stable = notYanked.filter((release) => release.channel === "stable")
  const pool = stable.length > 0 ? stable : notYanked

  if (pool.length === 0) {
    return undefined
  }

  return [...pool].sort((left, right) =>
    compareVersions(right.version, left.version, scheme)
  )[0]
}

function parsePrerelease(value: string): Array<string | number> {
  return value.split(".").map((part) => {
    if (/^(0|[1-9]\d*)$/.test(part)) {
      return Number(part)
    }
    return part.toLowerCase()
  })
}

function comparePrereleaseIdentifiers(
  left: Array<string | number>,
  right: Array<string | number>
): number {
  const length = Math.max(left.length, right.length)

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index]
    const rightValue = right[index]

    if (leftValue === undefined) return -1
    if (rightValue === undefined) return 1
    if (leftValue === rightValue) continue

    const leftIsNumber = typeof leftValue === "number"
    const rightIsNumber = typeof rightValue === "number"

    if (leftIsNumber && rightIsNumber) {
      return leftValue < rightValue ? -1 : 1
    }
    if (leftIsNumber) return -1
    if (rightIsNumber) return 1

    return String(leftValue).localeCompare(String(rightValue))
  }

  return 0
}
