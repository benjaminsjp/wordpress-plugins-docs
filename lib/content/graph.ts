import { ISSUE_CODES, type Issue } from "./issue-codes"
import type { PluginRecord } from "./load-plugins"
import { isInternalDependency, type DependencyType } from "./schemas"
import {
  compareVersions,
  isValidVersion,
  selectLatestRelease,
} from "./versions"

export type DependencyEdge = {
  from: string
  to: string
  type: DependencyType
  minVersion?: string
  file: string
}

export type PluginGraph = {
  edges: DependencyEdge[]
  dependents: Map<string, string[]>
}

export function buildPluginGraph(plugins: PluginRecord[]): PluginGraph {
  const edges: DependencyEdge[] = []
  const dependents = new Map<string, string[]>()

  for (const plugin of plugins) {
    dependents.set(plugin.slug, [])
  }

  for (const plugin of plugins) {
    const latest = selectLatestRelease(plugin.releases, plugin.versionScheme)
    if (!latest) continue

    for (const dependency of latest.dependencies) {
      if (!isInternalDependency(dependency)) continue

      edges.push({
        from: plugin.slug,
        to: dependency.plugin,
        type: dependency.type,
        minVersion: dependency.minVersion,
        file: latest.file,
      })

      const list = dependents.get(dependency.plugin)
      if (list && !list.includes(plugin.slug)) {
        list.push(plugin.slug)
      }
    }
  }

  for (const list of dependents.values()) {
    list.sort()
  }

  return { edges, dependents }
}

export function collectGraphIssues(plugins: PluginRecord[]): Issue[] {
  const issues: Issue[] = []
  const bySlug = new Map(plugins.map((plugin) => [plugin.slug, plugin]))

  for (const plugin of plugins) {
    for (const release of plugin.releases) {
      for (const dependency of release.dependencies) {
        if (!isInternalDependency(dependency)) continue

        if (dependency.plugin === plugin.slug) {
          issues.push({
            code: ISSUE_CODES.SELF_DEPENDENCY,
            severity: "error",
            file: release.file,
            path: "dependencies",
            message: `Plugin "${plugin.slug}" cannot depend on itself.`,
          })
          continue
        }

        const target = bySlug.get(dependency.plugin)
        if (!target) {
          issues.push({
            code: ISSUE_CODES.REF_MISSING,
            severity: "error",
            file: release.file,
            path: "dependencies",
            message: `Dependency "${dependency.plugin}" does not exist.`,
          })
          continue
        }

        if (
          dependency.minVersion &&
          !isValidVersion(dependency.minVersion, target.versionScheme)
        ) {
          issues.push({
            code: ISSUE_CODES.MIN_VERSION_INVALID,
            severity: "error",
            file: release.file,
            path: "dependencies.minVersion",
            message: `minVersion "${dependency.minVersion}" is not valid for ${target.slug}'s ${target.versionScheme} scheme.`,
          })
          continue
        }

        const latestTarget = selectLatestRelease(
          target.releases,
          target.versionScheme
        )
        if (
          dependency.minVersion &&
          latestTarget &&
          compareVersions(
            dependency.minVersion,
            latestTarget.version,
            target.versionScheme
          ) > 0
        ) {
          issues.push({
            code: ISSUE_CODES.MIN_VERSION_UNSATISFIED,
            severity: "warning",
            file: release.file,
            path: "dependencies.minVersion",
            message: `minVersion ${dependency.minVersion} is higher than the latest ${target.slug} release (${latestTarget.version}).`,
          })
        }
      }
    }
  }

  const graph = buildPluginGraph(plugins)
  issues.push(...collectCycleIssues(graph))
  return issues
}

function collectCycleIssues(graph: PluginGraph): Issue[] {
  const issues: Issue[] = []
  const requiredCycles = findCycles(graph.edges.filter((edge) => edge.type === "required"))
  const reported = new Set<string>()

  for (const cycle of requiredCycles) {
    const key = cycleKey(cycle)
    if (reported.has(key)) continue
    reported.add(key)
    const edge = graph.edges.find(
      (item) => item.from === cycle[0] && item.to === cycle[1]
    )
    issues.push({
      code: ISSUE_CODES.CYCLE_REQUIRED,
      severity: "error",
      file: edge?.file ?? cycle[0],
      message: `Required dependency cycle: ${cycle.join(" -> ")}.`,
    })
  }

  const optionalCycles = findCycles(graph.edges).filter((cycle) => {
    const key = cycleKey(cycle)
    return !reported.has(key)
  })

  for (const cycle of optionalCycles) {
    const edge = graph.edges.find(
      (item) => item.from === cycle[0] && item.to === cycle[1]
    )
    issues.push({
      code: ISSUE_CODES.CYCLE_OPTIONAL,
      severity: "warning",
      file: edge?.file ?? cycle[0],
      message: `Optional dependency cycle: ${cycle.join(" -> ")}.`,
    })
  }

  return issues
}

function findCycles(edges: DependencyEdge[]): string[][] {
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    const list = adjacency.get(edge.from) ?? []
    if (!list.includes(edge.to)) {
      list.push(edge.to)
    }
    adjacency.set(edge.from, list)
  }

  const cycles: string[][] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const stack: string[] = []

  function visit(node: string) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node)
      if (start >= 0) {
        cycles.push([...stack.slice(start), node])
      }
      return
    }
    if (visited.has(node)) return

    visiting.add(node)
    stack.push(node)
    for (const next of adjacency.get(node) ?? []) {
      visit(next)
    }
    stack.pop()
    visiting.delete(node)
    visited.add(node)
  }

  for (const node of adjacency.keys()) {
    visit(node)
  }

  return cycles
}

function cycleKey(cycle: string[]): string {
  const nodes = cycle.slice(0, -1)
  const start = nodes.indexOf([...nodes].sort()[0] ?? nodes[0])
  const rotated = [...nodes.slice(start), ...nodes.slice(0, start)]
  return rotated.join(">")
}
