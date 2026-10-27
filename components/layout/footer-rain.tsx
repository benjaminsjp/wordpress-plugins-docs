"use client"

import { useEffect, useRef } from "react"

const CELL_WIDTH = 13
const CELL_HEIGHT = 17
const FONT_SIZE = 13
const GLITCH_RADIUS = 90
const GLITCH_CHARS = "{}[]<>/;:=+*#%&$01"
const HIGHLIGHT_MAX_ROW = 0.7
const GREEN_CHANCE = 0.05

type Colors = {
  muted: string
  primary: string
  background: string
  foreground: string
}

type Grid = {
  cols: number
  rows: number
  chars: string[]
  green: Uint8Array
  highlight: Uint8Array
  highlightWidth: Uint8Array
}

function hash(x: number, y: number, salt = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453
  return n - Math.floor(n)
}

function readColors(element: HTMLElement): Colors {
  const styles = getComputedStyle(element)
  return {
    muted: styles.getPropertyValue("--muted-foreground").trim() || "#888",
    primary: styles.getPropertyValue("--primary").trim() || "#0f766e",
    background: styles.getPropertyValue("--background").trim() || "#111",
    foreground: styles.getPropertyValue("--foreground").trim() || "#111",
  }
}

function buildStream(words: string[]): string {
  const parts = words.length > 0 ? words : ["Dokumentasjon"]
  return parts.join("  ") + "  "
}

function buildGrid(cols: number, rows: number, stream: string): Grid {
  const total = cols * rows
  const chars = new Array<string>(total)
  const green = new Uint8Array(total)
  const highlight = new Uint8Array(total)
  const highlightWidth = new Uint8Array(total)

  for (let i = 0; i < total; i += 1) {
    chars[i] = stream[i % stream.length] ?? " "
    if (hash(i % cols, Math.floor(i / cols), 3) < GREEN_CHANCE) {
      green[i] = 1
    }
  }

  const maxHighlightRow = Math.floor(rows * HIGHLIGHT_MAX_ROW)
  for (let y = 0; y < maxHighlightRow; y += 1) {
    let x = 2
    while (x < cols - 4) {
      if (hash(x, y, 9) > 0.93) {
        const width = 4 + Math.floor(hash(x, y, 11) * 6)
        const end = Math.min(cols - 1, x + width)
        const startIndex = y * cols + x
        highlight[startIndex] = 1
        highlightWidth[startIndex] = end - x
        x = end + 3
      } else {
        x += 1
      }
    }
  }

  return { cols, rows, chars, green, highlight, highlightWidth }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function FooterRain({ words }: { words: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const context = canvas.getContext("2d")
    if (!context) return

    const stream = buildStream(words)
    let grid: Grid | null = null
    let colors = readColors(wrap)
    let frame = 0
    let visible = true
    let reduced = prefersReducedMotion()
    let pointer: { x: number; y: number } | null = null
    let glitchTick = 0
    let resizeTimer = 0

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const cols = Math.max(1, Math.ceil(width / CELL_WIDTH))
      const rows = Math.max(1, Math.ceil(height / CELL_HEIGHT))
      grid = buildGrid(cols, rows, stream)
      colors = readColors(wrap)
    }

    const draw = (time: number) => {
      if (!grid) return
      const { cols, rows, chars, green, highlight, highlightWidth } = grid
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      context.fillStyle = colors.background
      context.fillRect(0, 0, width, height)
      context.font = `${FONT_SIZE}px var(--font-geist-mono), ui-monospace, monospace`
      context.textBaseline = "top"

      const t = reduced ? 0 : time * 0.00045

      for (let y = 0; y < rows; y += 1) {
        const yNorm = rows === 1 ? 0 : y / (rows - 1)
        const fade = 1 - yNorm ** 1.55
        const opacity = 0.3 + 0.7 * (1 - yNorm)

        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const cellX = x * CELL_WIDTH
          const cellY = y * CELL_HEIGHT
          const dx = pointer ? pointer.x - (cellX + CELL_WIDTH / 2) : 0
          const dy = pointer ? pointer.y - (cellY + CELL_HEIGHT / 2) : 0
          const inGlitch =
            Boolean(pointer) &&
            !reduced &&
            dx * dx + dy * dy < GLITCH_RADIUS * GLITCH_RADIUS

          const wave = reduced ? 0 : 0.14 * Math.sin(t + x * 0.16)
          const threshold = fade + wave
          const noise = hash(x, y, 1)
          const visibleCell = inGlitch || noise < threshold

          if (!visibleCell) continue

          const highlightLen = highlight[index]
          if (highlightLen && !inGlitch && yNorm < HIGHLIGHT_MAX_ROW) {
            const blockWidth = highlightWidth[index] * CELL_WIDTH
            context.globalAlpha = Math.min(1, opacity + 0.15)
            context.fillStyle = colors.primary
            context.fillRect(cellX, cellY, blockWidth, CELL_HEIGHT)
            context.fillStyle = colors.background
            let text = ""
            for (let offset = 0; offset < highlightWidth[index]; offset += 1) {
              text += chars[index + offset] ?? " "
            }
            context.fillText(text, cellX, cellY + 1)
            x += highlightWidth[index] - 1
            continue
          }

          let glyph = chars[index] ?? " "
          if (inGlitch) {
            const pick = (x * 17 + y * 31 + glitchTick) % GLITCH_CHARS.length
            glyph = GLITCH_CHARS[pick] ?? glyph
          }

          context.globalAlpha = inGlitch ? 1 : opacity
          context.fillStyle =
            inGlitch || green[index] ? colors.primary : colors.muted
          context.fillText(glyph, cellX, cellY + 1)
        }
      }

      context.globalAlpha = 1
    }

    sizeCanvas()
    draw(0)

    const loop = (time: number) => {
      frame = requestAnimationFrame(loop)
      if (!visible || reduced) return
      glitchTick += 1
      draw(time)
    }

    if (!reduced) {
      frame = requestAnimationFrame(loop)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    const onPointerLeave = () => {
      pointer = null
    }

    const onResize = () => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        sizeCanvas()
        draw(performance.now())
      }, 120)
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onMotion = () => {
      reduced = motionQuery.matches
      if (reduced) {
        cancelAnimationFrame(frame)
        pointer = null
        draw(0)
      } else if (visible) {
        frame = requestAnimationFrame(loop)
      }
    }

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = Boolean(entry?.isIntersecting)
        if (visible && !reduced) {
          cancelAnimationFrame(frame)
          frame = requestAnimationFrame(loop)
        }
      },
      { rootMargin: "80px" }
    )
    intersection.observe(wrap)

    const themeObserver = new MutationObserver(() => {
      colors = readColors(wrap)
      draw(performance.now())
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerleave", onPointerLeave)
    window.addEventListener("resize", onResize)
    motionQuery.addEventListener("change", onMotion)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(resizeTimer)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerleave", onPointerLeave)
      window.removeEventListener("resize", onResize)
      motionQuery.removeEventListener("change", onMotion)
      intersection.disconnect()
      themeObserver.disconnect()
    }
  }, [words])

  return (
    <div
      ref={wrapRef}
      className="h-[280px] w-full overflow-hidden bg-background md:h-[420px]"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  )
}
