require('dotenv').config()
const http = require('http')
const express = require('express')
const cors = require('cors')
const { WebSocketServer } = require('ws')
const { setupWSConnection, docs } = require('y-websocket/bin/utils')
const jwt = require('jsonwebtoken')
const Y = require('yjs')
const { loadDocument, setupAutosave } = require('./persistence')
const { connectRedis, registerDocWithRedis } = require('./redis-adapter')
const runMigrations = require('./migrate')

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())

app.use('/auth', require('./routes/auth'))
app.use('/docs', require('./routes/docs'))
app.use('/ai', require('./routes/ai'))
app.use('/execute', require('./routes/execute'))
app.use('/history', require('./routes/history'))
app.use('/comments', require('./routes/comments'))
app.use('/files', require('./routes/files'))
app.use('/invite', require('./routes/invite'))
app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.get('/setup-db', async (req, res) => {
  try {
    await runMigrations()
    res.send('<h1>✅ Database initialized successfully!</h1><p>All tables have been created. You can now close this tab and start using the app.</p>')
  } catch (err) {
    res.status(500).send('<h1>❌ Database initialization failed!</h1><pre>' + err.message + '</pre>')
  }
})

const server = http.createServer(app)
const wss = new WebSocketServer({ server })

const initializedDocs = new Set()
const docCleanups = new Map()

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, 'ws://localhost')
  const token = url.searchParams.get('token')
  try {
    jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    ws.close(1008, 'Unauthorized')
    return
  }

  // Let y-websocket create doc + conns internally FIRST
  setupWSConnection(ws, req, { gc: true })

  // Now get the doc y-websocket just created
  const roomName = decodeURIComponent(url.pathname.slice(1))
  const docId = roomName.replace('doc-', '')
  if (!docId) return

  // Only initialize once per doc per server lifetime
  if (!initializedDocs.has(docId)) {
    initializedDocs.add(docId)

    const ydoc = docs.get(roomName)
    if (!ydoc) return

    // Apply persisted CRDT state from DB
    const persistedDoc = await loadDocument(docId)
    if (persistedDoc) {
      const savedUpdate = Y.encodeStateAsUpdate(persistedDoc)
      Y.applyUpdate(ydoc, savedUpdate)
      console.log('Restored doc ' + docId + ' from DB')
    }

    // Wire autosave + Redis
    const cleanup = setupAutosave(docId, ydoc)
    docCleanups.set(docId, cleanup)
    registerDocWithRedis(roomName, ydoc)
    console.log('Doc ' + docId + ' ready')
  }
})

process.on('SIGTERM', () => {
  docCleanups.forEach(cleanup => cleanup())
  process.exit(0)
})

async function start() {
  await connectRedis()
  const PORT = process.env.PORT || 1234
  server.listen(PORT, () => console.log('Server on port ' + PORT))
}

start()