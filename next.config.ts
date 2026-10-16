import type { NextConfig } from 'next'

const config: NextConfig = {
  // Images are resized in the browser and uploaded one per request (≤5 MB + multipart overhead).
  experimental: { serverActions: { bodySizeLimit: '6mb' } },
}

export default config
