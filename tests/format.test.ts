import { describe, expect, it } from "vitest"
import { formatDate, formatFileSize } from "@/lib/format"

describe("formatDate", () => {
  it("formats an ISO date in Norwegian Bokmål", () => {
    expect(formatDate("2026-09-02")).toBe("2. september 2026")
  })
})

describe("formatFileSize", () => {
  it("keeps byte values as whole numbers", () => {
    expect(formatFileSize(512)).toBe("512 B")
  })

  it("formats kibibytes with a Norwegian decimal separator", () => {
    expect(formatFileSize(1536)).toBe("1,5 KB")
  })
})
