const Y = require('yjs')
const { pool } = require('./db')

async function loadDocument(docId) {
  try {
    const result = await pool.query(
      'SELECT ydoc_state FROM documents WHERE id=$1',
      [docId]
    )
    if (!result.rows[0]?.ydoc_state) return null
    const ydoc = new Y.Doc()
    Y.applyUpdate(ydoc, result.rows[0].ydoc_state)
    return ydoc
  } catch (err) {
    console.error('loadDocument error:', err.message)
    return null
  }
}

async function saveDocument(docId, ydoc) {
  try {
    const state = Buffer.from(Y.encodeStateAsUpdate(ydoc))
    await pool.query(
      `UPDATE documents
       SET ydoc_state=$2, op_count=op_count+1, updated_at=NOW()
       WHERE id=$1`,
      [docId, state]
    )
    return state
  } catch (err) {
    console.error('saveDocument error:', err.message)
  }
}

// Save a named snapshot for version history
async function saveSnapshot(docId, ydoc, commitMsg, createdBy) {
  try {
    const state = Buffer.from(Y.encodeStateAsUpdate(ydoc))
    // Legacy doc_snapshots table
    await pool.query(
      `INSERT INTO doc_snapshots (doc_id, ydoc_state, snapshot_size, saved_at)
       VALUES ($1, $2, $3, NOW())`,
      [docId, state, state.length]
    )
    await pool.query(
      `DELETE FROM doc_snapshots WHERE doc_id=$1
       AND id NOT IN (
         SELECT id FROM doc_snapshots WHERE doc_id=$1
         ORDER BY saved_at DESC LIMIT 20
       )`,
      [docId]
    )
    // New doc_versions table (for the History panel UI)
    await pool.query(
      `INSERT INTO doc_versions (doc_id, snapshot_data, commit_msg, created_by)
       VALUES ($1, $2, $3, $4)`,
      [docId, state, commitMsg || 'Auto-save', createdBy || null]
    )
    // Keep only last 50 versions per doc
    await pool.query(
      `DELETE FROM doc_versions WHERE doc_id=$1
       AND id NOT IN (
         SELECT id FROM doc_versions WHERE doc_id=$1
         ORDER BY created_at DESC LIMIT 50
       )`,
      [docId]
    )
  } catch (err) {
    console.error('saveSnapshot error:', err.message)
  }
}

function setupAutosave(docId, ydoc) {
  let opCount = 0
  let saveTimeout = null
  let snapshotCount = 0

  ydoc.on('update', () => {
    opCount++
    snapshotCount++

    // Debounced save — 2s after last keystroke
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveDocument(docId, ydoc)
    }, 2000)

    // Force save every 100 ops
    if (opCount >= 100) {
      clearTimeout(saveTimeout)
      saveDocument(docId, ydoc)
      opCount = 0
    }

    // Save a version snapshot every 200 ops
    if (snapshotCount >= 200) {
      saveSnapshot(docId, ydoc)
      snapshotCount = 0
    }
  })

  // Periodic save every 30s + snapshot every 5 min
  const saveInterval = setInterval(() => saveDocument(docId, ydoc), 30_000)
  const snapshotInterval = setInterval(() => saveSnapshot(docId, ydoc), 300_000)

  return () => {
    clearTimeout(saveTimeout)
    clearInterval(saveInterval)
    clearInterval(snapshotInterval)
    saveDocument(docId, ydoc)
  }
}

module.exports = { loadDocument, saveDocument, saveSnapshot, setupAutosave }