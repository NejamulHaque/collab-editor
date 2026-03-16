const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  const { title } = req.body
  try {
    const result = await pool.query(
      'INSERT INTO documents (title, owner_id) VALUES ($1,$2) RETURNING *',
      [title || 'Untitled', req.user.userId]
    )
    const doc = result.rows[0]
    await pool.query(
      'INSERT INTO doc_members (doc_id, user_id, role) VALUES ($1,$2,$3)',
      [doc.id, req.user.userId, 'owner']
    )
    res.json(doc)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.* FROM documents d
       JOIN doc_members m ON m.doc_id = d.id
       WHERE m.user_id = $1
       ORDER BY d.updated_at DESC`,
      [req.user.userId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/:id', auth, async (req, res) => {
  const { title } = req.body
  try {
    const result = await pool.query(
      `UPDATE documents SET title=$1, updated_at=NOW()
       WHERE id=$2 AND owner_id=$3 RETURNING *`,
      [title, req.params.id, req.user.userId]
    )
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM doc_members WHERE doc_id=$1', [req.params.id])
    await pool.query(
      'DELETE FROM documents WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router