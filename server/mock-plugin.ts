import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { request as httpsRequest, Agent } from 'node:https'
import { getSymbolList, generateSymbolValue } from './utils/mockData'

function send(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendError(res: ServerResponse, status: number, detail: string): void {
  send(res, status, { title: 'Error', status, detail })
}

const STATIC_PATH_MAP: Record<string, string> = {
  '/api/auth/token': '/api/v1/auth/token',
  '/api/symbols': '/api/v1/logic-engine/symbols',
}

function resolveDevicePath(pathname: string): string | undefined {
  if (STATIC_PATH_MAP[pathname]) return STATIC_PATH_MAP[pathname]
  const match = pathname.match(/^\/api\/symbols\/(.+)$/)
  if (match) return `/api/v1/logic-engine/symbols/${match[1]}`
  return undefined
}

async function proxyToDevice(
  deviceIp: string,
  devicePath: string,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  return new Promise((resolve) => {
    const agent = new Agent({ rejectUnauthorized: false })
    const proxyReq = httpsRequest(
      { hostname: deviceIp, port: 443, path: devicePath, method: req.method, headers: req.headers, agent },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode!, proxyRes.headers as Record<string, string>)
        proxyRes.pipe(res)
        proxyRes.on('end', resolve)
      },
    )
    proxyReq.on('error', (err) => {
      console.error('[mock-api] proxy error:', err.message)
      sendError(res, 502, 'Upstream device unreachable')
      resolve()
    })
    req.pipe(proxyReq)
  })
}

function handleMock(req: IncomingMessage, res: ServerResponse, pathname: string, search: URLSearchParams): boolean {
  if (req.method === 'GET' && pathname === '/api/auth/token') {
    const authHeader = (req.headers['authorization'] as string | undefined) ?? ''
    if (!authHeader.startsWith('Basic ')) { sendError(res, 401, 'Missing Basic credentials'); return true }
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8')
    const colonIdx = decoded.indexOf(':')
    const username = decoded.slice(0, colonIdx)
    const password = decoded.slice(colonIdx + 1)
    if (username === 'testuser' && password === 'testpass') {
      send(res, 200, { AccessToken: `mock-bearer-${Date.now()}`, ExpiresIn: 3600, Scope: 'api', TokenType: 'Bearer' })
    }
    else {
      sendError(res, 401, 'Invalid credentials')
    }
    return true
  }

  if (req.method === 'GET' && pathname === '/api/symbols') {
    setTimeout(() => {
      let symbols = getSymbolList()
      const sort = search.get('sort')
      const limit = search.get('limit')
      if (sort === 'asc') symbols = [...symbols].sort((a, b) => a.Name.localeCompare(b.Name))
      else if (sort === 'desc') symbols = [...symbols].sort((a, b) => b.Name.localeCompare(a.Name))
      if (limit) symbols = symbols.slice(0, Number(limit))
      send(res, 200, symbols)
    }, 150)
    return true
  }

  const symbolMatch = pathname.match(/^\/api\/symbols\/(.+)$/)
  if (req.method === 'GET' && symbolMatch) {
    const name = decodeURIComponent(symbolMatch[1]!)
    const value = generateSymbolValue(name)
    if (!value) sendError(res, 404, `Symbol '${name}' not found`)
    else send(res, 200, value)
    return true
  }

  return false
}

function makeMiddleware(deviceIp?: string) {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url!, 'http://localhost')
    const { pathname, searchParams } = url

    if (!pathname.startsWith('/api/')) return next()

    if (deviceIp) {
      const devicePath = resolveDevicePath(pathname)
      if (!devicePath) return next()
      await proxyToDevice(deviceIp, devicePath + url.search, req, res)
    }
    else {
      if (!handleMock(req, res, pathname, searchParams)) next()
    }
  }
}

export function mockApiPlugin(): Plugin {
  const deviceIp = process.env.VITE_DEVICE_IP || undefined

  return {
    name: 'sel-mock-api',
    configureServer(server) {
      server.middlewares.use(makeMiddleware(deviceIp))
    },
    configurePreviewServer(server) {
      server.middlewares.use(makeMiddleware(deviceIp))
    },
  }
}
