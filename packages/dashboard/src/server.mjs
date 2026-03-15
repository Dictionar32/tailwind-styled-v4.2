import http from "node:http"

const port = Number(process.env.PORT ?? 3000)
const metrics = {
  generatedAt: new Date().toISOString(),
  buildMs: 83,
  scanMs: 11,
  memoryMb: { rss: 120, heapUsed: 36 },
}

const html = `<!doctype html>
<html>
  <head><meta charset="utf-8"/><title>tailwind-styled dashboard</title></head>
  <body style="font-family: sans-serif; margin: 2rem;">
    <h1>tailwind-styled dashboard</h1>
    <pre id="metrics"></pre>
    <script>
      fetch('/metrics').then(r => r.json()).then(data => {
        document.getElementById('metrics').textContent = JSON.stringify(data, null, 2)
      })
    </script>
  </body>
</html>`

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.statusCode = 400
    res.end("Bad request")
    return
  }

  if (req.url.startsWith("/metrics")) {
    res.setHeader("content-type", "application/json")
    res.end(JSON.stringify(metrics, null, 2))
    return
  }

  res.setHeader("content-type", "text/html; charset=utf-8")
  res.end(html)
})

server.listen(port, () => {
  console.log(`dashboard available at http://localhost:${port}`)
})
