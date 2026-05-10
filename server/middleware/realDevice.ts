import { Agent } from 'node:https'
import { proxyRequest } from 'h3'

// Maps our internal /api/* paths to the device's /api/v1/* paths
const PATH_MAP: Record<string, string> = {
  '/api/auth/token': '/api/v1/auth/token',
  '/api/symbols': '/api/v1/logic-engine/symbols',
}

function resolveDevicePath(pathname: string): string | undefined {
  if (PATH_MAP[pathname]) return PATH_MAP[pathname]

  const match = pathname.match(/^\/api\/symbols\/(.+)$/)
  if (match) return `/api/v1/logic-engine/symbols/${encodeURIComponent(match[1])}`

  return undefined
}

export default defineEventHandler(async (event) => {
  const deviceIp = process.env.NUXT_PUBLIC_DEVICE_IP
  if (!deviceIp) return // no device configured — fall through to mock routes

  const pathname = event.path.split('?')[0]
  if (!pathname.startsWith('/api/')) return

  const devicePath = resolveDevicePath(pathname)
  if (!devicePath) return

  const search = getRequestURL(event).search
  const targetUrl = `https://${deviceIp}${devicePath}${search}`

  // Allow self-signed certificates on the industrial device.
  // NODE_TLS_REJECT_UNAUTHORIZED=0 can also be set globally in the environment.
  const agent = new Agent({ rejectUnauthorized: false })

  return proxyRequest(event, targetUrl, {
    // @ts-expect-error — ofetch accepts agent but types don't expose it
    fetchOptions: { agent },
  })
})
