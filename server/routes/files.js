const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')

// ===== PROJECT ROUTES =====

// GET /files/projects — list user's projects
router.get('/projects', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.* FROM projects p
       LEFT JOIN project_members m ON m.project_id = p.id AND m.user_id=$1
       WHERE p.owner_id=$1 OR m.user_id=$1
       ORDER BY p.updated_at DESC`,
      [req.user.userId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /files/projects — create project
router.post('/projects', auth, async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  try {
    const result = await pool.query(
      'INSERT INTO projects (name, owner_id) VALUES ($1,$2) RETURNING *',
      [name.trim(), req.user.userId]
    )
    await pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)',
      [result.rows[0].id, req.user.userId, 'owner']
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /files/projects/:id
router.delete('/projects/:id', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM projects WHERE id=$1 AND owner_id=$2',
      [req.params.id, req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ===== FILE TREE ROUTES =====

// GET /files/:projectId/tree — get file tree for a project
router.get('/:projectId/tree', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT f.*, d.title AS doc_title FROM files f
       LEFT JOIN documents d ON d.id = f.doc_id
       WHERE f.project_id=$1
       ORDER BY f.is_folder DESC, f.name ASC`,
      [req.params.projectId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /files/:projectId — create a file or folder
router.post('/:projectId', auth, async (req, res) => {
  const { name, is_folder, parent_id } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  try {
    let docId = null
    if (!is_folder) {
      // Auto-create a linked document
      const docRes = await pool.query(
        'INSERT INTO documents (title, owner_id) VALUES ($1,$2) RETURNING id',
        [name.trim(), req.user.userId]
      )
      docId = docRes.rows[0].id
      await pool.query(
        'INSERT INTO doc_members (doc_id, user_id, role) VALUES ($1,$2,$3)',
        [docId, req.user.userId, 'owner']
      )
    }
    const result = await pool.query(
      `INSERT INTO files (project_id, name, parent_id, is_folder, doc_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.projectId, name.trim(), parent_id || null, is_folder || false, docId]
    )
    res.status(201).json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /files/:projectId/:fileId — rename
router.patch('/:projectId/:fileId', auth, async (req, res) => {
  const { name } = req.body
  try {
    const result = await pool.query(
      'UPDATE files SET name=$1 WHERE id=$2 AND project_id=$3 RETURNING *',
      [name, req.params.fileId, req.params.projectId]
    )
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /files/:projectId/:fileId
router.delete('/:projectId/:fileId', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM files WHERE id=$1 AND project_id=$2', [req.params.fileId, req.params.projectId])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
