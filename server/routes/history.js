const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')
const Y = require('yjs')

// GET /history/:docId — list saved versions
router.get('/:docId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.commit_msg, v.created_at, u.name AS author
       FROM doc_versions v
       LEFT JOIN users u ON u.id = v.created_by
       WHERE v.doc_id = $1
       ORDER BY v.created_at DESC
       LIMIT 50`,
      [req.params.docId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /history/:docId — manually save a named version
router.post('/:docId', auth, async (req, res) => {
  const { snapshot_data, commit_msg } = req.body
  if (!snapshot_data) return res.status(400).json({ error: 'snapshot_data is required' })
  try {
    const buf = Buffer.from(snapshot_data, 'base64')
    const result = await pool.query(
      `INSERT INTO doc_versions (doc_id, snapshot_data, commit_msg, created_by)
       VALUES ($1, $2, $3, $4) RETURNING id, commit_msg, created_at`,
      [req.params.docId, buf, commit_msg || 'Manual save', req.user.userId]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /history/:docId/:versionId/content — get the text content of a snapshot
router.get('/:docId/:versionId/content', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT snapshot_data FROM doc_versions WHERE id=$1 AND doc_id=$2',
      [req.params.versionId, req.params.docId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Version not found' })
    const ydoc = new Y.Doc()
    Y.applyUpdate(ydoc, result.rows[0].snapshot_data)
    const text = ydoc.getText('content').toString()
    res.json({ text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
