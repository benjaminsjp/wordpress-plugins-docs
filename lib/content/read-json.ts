import { readFile } from "node:fs/promises"
import type { ZodType } from "zod"
import { ISSUE_CODES, type Issue } from "./issue-codes"

export async function readJson(
  file: string,
  relativeFile: string
): Promise<{ data: unknown; issues: Issue[] }> {
  let text: string

  try {
    text = await readFile(file, "utf8")
  } catch (error) {
    return {
      data: undefined,
      issues: [
        {
          code: ISSUE_CODES.SCHEMA,
          severity: "error",
          file: relativeFile,
          message:
            error instanceof Error
              ? `Could not read JSON file: ${error.message}`
              : "Could not read JSON file.",
        },
      ],
    }
  }

  try {
    return { data: JSON.parse(text) as unknown, issues: [] }
  } catch (error) {
    return {
      data: undefined,
      issues: [
        {
          code: ISSUE_CODES.SCHEMA,
          severity: "error",
          file: relativeFile,
          message:
            error instanceof Error
              ? `Invalid JSON: ${error.message}`
              : "Invalid JSON.",
        },
      ],
    }
  }
}

export function parseWithSchema<T>(
  schema: ZodType<T>,
  data: unknown,
  relativeFile: string
): { value: T | undefined; issues: Issue[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { value: result.data, issues: [] }
  }

  return {
    value: undefined,
    issues: result.error.issues.map((issue) => ({
      code: ISSUE_CODES.SCHEMA,
      severity: "error" as const,
      file: relativeFile,
      path: issue.path.map(String).join(".") || undefined,
      message: issue.message,
    })),
  }
}
