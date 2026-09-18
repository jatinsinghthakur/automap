import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import dns from 'node:dns'

dns.setDefaultResultOrder('ipv4first')

const bhuNakshaProxyPlugin = () => ({
  name: 'bhunaksha-proxy',
  configureServer(server) {
    server.middlewares.use('/bhunakshaserver', (req, res) => {
      const chunks = []
      req.on('data', c => chunks.push(c))
      req.on('end', () => {
        const body = Buffer.concat(chunks)
        const subPath = req.url.startsWith('/bhunakshaserver') 
          ? req.url 
          : `/bhunakshaserver${req.url.startsWith('/') ? '' : '/'}${req.url}`

        const proxyHeaders = {
          'host': 'upbhunaksha.gov.in',
          'origin': 'https://upbhunaksha.gov.in',
          'referer': 'https://upbhunaksha.gov.in/home',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'content-type': req.headers['content-type'] || 'application/x-www-form-urlencoded'
        }
        if (body.length > 0) {
          proxyHeaders['content-length'] = body.length
        }

        const proxyReq = https.request({
          hostname: 'upbhunaksha.gov.in',
          port: 443,
          path: subPath,
          method: req.method,
          family: 4,
          headers: proxyHeaders
        }, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers)
          proxyRes.pipe(res)
        })

        proxyReq.on('error', (err) => {
          console.error('[Proxy Error]:', err.message, 'for path:', subPath)
          if (!res.headersSent) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Proxy Gateway Error', details: err.message }))
          }
        })

        if (body.length > 0) {
          proxyReq.write(body)
        }
        proxyReq.end()
      })
    })
  }
})

export default defineConfig({
  plugins: [react(), bhuNakshaProxyPlugin()],
  server: {
    port: 5173
  }
})
