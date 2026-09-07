import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function meetingSourceProxy() {
  return {
    name: 'meeting-source-proxy',
    configureServer(server) {
      server.middlewares.use('/__meeting-source', async (req, res) => {
        try {
          const localUrl = new URL(req.url || '/', 'http://localhost')
          const weekStart = localUrl.searchParams.get('week_start')
          if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: 'week_start inválido' }))
            return
          }

          const d = new Date(`${weekStart}T12:00:00Z`)
          d.setUTCDate(d.getUTCDate() + 2)
          const source = `https://wol.jw.org/pt/wol/dt/r5/lp-t/${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`

          const upstream = await fetch(source, {
            headers: {
              Accept: 'text/html,application/xhtml+xml',
              'User-Agent': 'Mozilla/5.0 Oeste-de-Maracanau/1.0',
            },
          })
          if (!upstream.ok) throw new Error(`Fonte oficial respondeu ${upstream.status}`)

          const html = await upstream.text()
          res.statusCode = 200
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store')
          res.end(html)
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: error?.message || 'Falha ao acessar a fonte oficial' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), meetingSourceProxy()],
  base: '/Oeste-de-Maracanau/',
})
