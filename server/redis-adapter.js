const Y = require('yjs')
const { createClient } = require('redis')

let publisher = null
let subscriber = null

// Map of roomName -> cleanup function
const roomCleanups = new Map()

async function connectRedis() {
  try {
    publisher = createClient({ url: process.env.REDIS_URL })
    subscriber = createClient({ url: process.env.REDIS_URL })

    publisher.on('error', err => console.error('Redis publisher error:', err.message))
    subscriber.on('error', err => console.error('Redis subscriber error:', err.message))

    await publisher.connect()
    await subscriber.connect()
    console.log('Redis connected')
  } catch (err) {
    console.error('Redis connection failed:', err.message)
    console.log('Continuing without Redis (single-server mode)')
  }
}

function isRedisReady() {
  return publisher?.isReady && subscriber?.isReady
}

// Register a Yjs doc for cross-server sync via Redis pub/sub
function registerDocWithRedis(roomName, ydoc) {
  if (!isRedisReady()) return
  if (roomCleanups.has(roomName)) return // already registered

  const channel = `ydoc:${roomName}`

  // When THIS server gets a local update, publish to Redis
  // so OTHER servers can apply it to their copy
  const updateHandler = (update, origin) => {
    if (origin === 'redis') return // don't re-publish what came from Redis
    publisher.publish(channel, Buffer.from(update).toString('base64'))
      .catch(err => console.error('Redis publish error:', err.message))
  }
  ydoc.on('update', updateHandler)

  // When Redis delivers an update from ANOTHER server, apply it locally
  subscriber.subscribe(channel, (msg) => {
    try {
      const update = Buffer.from(msg, 'base64')
      Y.applyUpdate(ydoc, update, 'redis') // 'redis' marks the origin to avoid echo loop
    } catch (err) {
      console.error('Redis apply update error:', err.message)
    }
  }).catch(err => console.error('Redis subscribe error:', err.message))

  // Cleanup function
  const cleanup = () => {
    ydoc.off('update', updateHandler)
    subscriber.unsubscribe(channel).catch(() => {})
    roomCleanups.delete(roomName)
  }

  roomCleanups.set(roomName, cleanup)
  console.log(`Redis: registered room ${roomName}`)
  return cleanup
}

function unregisterDoc(roomName) {
  const cleanup = roomCleanups.get(roomName)
  if (cleanup) cleanup()
}

module.exports = { connectRedis, registerDocWithRedis, unregisterDoc, isRedisReady }