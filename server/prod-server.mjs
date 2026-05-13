/**
 * Production server: serves the Vite-built static files and proxies /api/* to
 * the real industrial device when VITE_DEVICE_IP is set.
 *
 * Usage: node server/prod-server.mjs
 *   VITE_DEVICE_IP=192.168.3.2  — required for real device
 *   NODE_TLS_REJECT_UNAUTHORIZED=0 — required when device has a self-signed cert
 *   PORT=3000 (optional, default 3000)
 */

import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { request as httpsRequest, Agent } from 'node:https'

const PORT = Number(process.env.PORT) || 3000
const DEVICE_IP = process.env.VITE_DEVICE_IP
const DIST = join(process.cwd(), 'dist')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

const STATIC_PATH_MAP = {
  '/api/auth/token': '/api/v1/auth/token',
  '/api/symbols': '/api/v1/logic-engine/symbols',
}

function resolveDevicePath(pathname) {
  if (STATIC_PATH_MAP[pathname]) return STATIC_PATH_MAP[pathname]
  const match = pathname.match(/^\/api\/symbols\/(.+)$/)
  if (match) return `/api/v1/logic-engine/symbols/${match[1]}`
  return undefined
}

function serveStatic(res, filePath) {
  const ext = extname(filePath)
  const mime = MIME[ext] ?? 'application/octet-stream'
  res.writeHead(200, { 'Content-Type': mime })
  createReadStream(filePath).pipe(res)
}

function serveSpa(res) {
  serveStatic(res, join(DIST, 'index.html'))
}

function proxyToDevice(devicePath, req, res) {
  const agent = new Agent({ rejectUnauthorized: false })
  const proxyReq = httpsRequest(
    { hostname: DEVICE_IP, port: 443, path: devicePath, method: req.method, headers: req.headers, agent },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', (err) => {
    console.error('[proxy] error:', err.message)
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ detail: 'Upstream device unreachable' }))
  })
  req.pipe(proxyReq)
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost`)
  const { pathname } = url

  // API proxy
  if (pathname.startsWith('/api/')) {
    if (!DEVICE_IP) {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ detail: 'No device configured. Set VITE_DEVICE_IP.' }))
      return
    }
    const devicePath = resolveDevicePath(pathname)
    if (!devicePath) { res.writeHead(404); res.end(); return }
    proxyToDevice(devicePath + url.search, req, res)
    return
  }

  // Static files
  const filePath = join(DIST, pathname === '/' ? 'index.html' : pathname)
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    serveStatic(res, filePath)
    return
  }

  // SPA fallback for client-side routes (/login, /dashboard, etc.)
  serveSpa(res)
})

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  if (!DEVICE_IP) console.warn('Warning: VITE_DEVICE_IP not set — API calls will return 503')
})
