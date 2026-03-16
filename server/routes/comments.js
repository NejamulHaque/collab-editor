const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')

// GET /comments/:docId — all comments for a doc
router.get('/:docId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, u.name AS author, u.email AS author_email
       FROM comments c JOIN users u ON u.id = c.user_id
       WHERE c.doc_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.docId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /comments/:docId — add a comment
router.post('/:docId', auth, async (req, res) => {
  const { content, line_number } = req.body
  if (!content?.trim()) return res.status(400).json({ error: 'content required' })
  try {
    const result = await pool.query(
      `INSERT INTO comments (doc_id, user_id, content, line_number)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [req.params.docId, req.user.userId, content.trim(), line_number || null]
    )
    // Attach author name for immediate frontend use
    const row = result.rows[0]
    const userRes = await pool.query('SELECT name, email FROM users WHERE id=$1', [req.user.userId])
    res.status(201).json({ ...row, author: userRes.rows[0]?.name, author_email: userRes.rows[0]?.email })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /comments/:docId/:commentId — resolve / edit
router.patch('/:docId/:commentId', auth, async (req, res) => {
  const { resolved, content } = req.body
  try {
    const updates = []
    const vals = [req.params.commentId, req.user.userId]
    if (resolved !== undefined) { updates.push(`resolved=$${vals.length + 1}`); vals.push(resolved) }
    if (content !== undefined)  { updates.push(`content=$${vals.length + 1}`);  vals.push(content) }
    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' })

    const result = await pool.query(
      `UPDATE comments SET ${updates.join(',')} WHERE id=$1 AND user_id=$2 RETURNING *`,
      vals
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found or not authorized' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /comments/:docId/:commentId
router.delete('/:docId/:commentId', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM comments WHERE id=$1 AND user_id=$2',
      [req.params.commentId, req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
