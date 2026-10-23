const LOCALE = "nb-NO"

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "long",
  day: "numeric",
})

const sizeFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 1,
})

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

const BYTE_UNITS = ["B", "KB", "MB", "GB"] as const

export function formatDate(value: string | Date): string {
  const date =
    typeof value === "string" ? parseDate(value) : value

  return dateFormatter.format(date)
}

export function formatFileSize(bytes: number): string {
  let value = bytes
  let unitIndex = 0

  while (value >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  const formatted =
    unitIndex === 0 ? String(bytes) : sizeFormatter.format(value)

  return `${formatted} ${BYTE_UNITS[unitIndex]}`
}

function parseDate(value: string): Date {
  const dateOnly = DATE_ONLY.exec(value)

  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2])
    const day = Number(dateOnly[3])
    return new Date(year, month - 1, day)
  }

  return new Date(value)
}
