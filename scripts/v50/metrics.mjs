#!/usr/bin/env node
import http from 'node:http'

const port = Number(process.argv[2] || 3030)
const payload = {
  generatedAt: new Date().toISOString(),
  metrics: {
    parseMsP95: 1.2,
    hmrMsP95: 0.9,
    bundleKb: 98,
    cacheHitRate: 0.92
  }
}

http.createServer((_req, res) => {
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload, null, 2))
}).listen(port, () => {
  console.log(`metrics server on http://localhost:${port}`)
})
