import type { NextConfig } from "next"
import createMDX from "@next/mdx"
import { getLatestZipRedirects } from "./lib/content/latest-zip"

const noindexHeader = {
  key: "X-Robots-Tag",
  value: "noindex",
}

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  async headers() {
    return [
      {
        source: "/",
        headers: [noindexHeader],
      },
      {
        source: "/:path*",
        headers: [noindexHeader],
      },
    ]
  },
  async redirects() {
    return getLatestZipRedirects()
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
})

export default withMDX(nextConfig)
