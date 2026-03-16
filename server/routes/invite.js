const router = require('express').Router()
const { pool } = require('../db')
const auth = require('../middleware/auth')
const { sendInviteEmail } = require('../utils/mailer')

// POST /invite — send an invite for a doc or project
router.post('/', auth, async (req, res) => {
  const { doc_id, project_id, invitee_email, role } = req.body
  if (!invitee_email) return res.status(400).json({ error: 'invitee_email required' })
  if (!doc_id && !project_id) return res.status(400).json({ error: 'doc_id or project_id required' })
  try {
    // Check invitee exists
    const userRes = await pool.query('SELECT id FROM users WHERE email=$1', [invitee_email])
    const inviteeId = userRes.rows[0]?.id

    const result = await pool.query(
      `INSERT INTO invites (doc_id, project_id, inviter_id, invitee_email, role)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [doc_id || null, project_id || null, req.user.userId, invitee_email, role || 'viewer']
    )

    // If they're already a registered user, grant access immediately
    if (inviteeId && doc_id) {
      await pool.query(
        `INSERT INTO doc_members (doc_id, user_id, role) VALUES ($1,$2,$3)
         ON CONFLICT (doc_id, user_id) DO UPDATE SET role=$3`,
        [doc_id, inviteeId, role || 'viewer']
      )
    }
    if (inviteeId && project_id) {
      await pool.query(
        `INSERT INTO project_members (project_id, user_id, role) VALUES ($1,$2,$3)
         ON CONFLICT (project_id, user_id) DO UPDATE SET role=$3`,
        [project_id, inviteeId, role || 'viewer']
      )
    }

    // Try sending email
    try {
      const inviterRes = await pool.query('SELECT name FROM users WHERE id=$1', [req.user.userId])
      const inviterName = inviterRes.rows[0]?.name || 'Someone'

      let itemName = 'a document'
      if (doc_id) {
        const docRes = await pool.query('SELECT title FROM docs WHERE id=$1', [doc_id]).catch(() => ({rows:[]}))
        if (docRes.rows && docRes.rows.length > 0) itemName = docRes.rows[0].title
      }

      const clientUrl = process.env.CORS_ORIGIN || 'https://collab-client-flt9.onrender.com'
      const itemLink = doc_id ? `${clientUrl}/doc/${doc_id}` : clientUrl

      await sendInviteEmail(invitee_email, inviterName, itemName, itemLink, role || 'viewer')
    } catch (emailErr) {
      console.error('Failed to dispatch explicit email:', emailErr.message)
    }

    res.status(201).json(result.rows[0] || { message: 'Already invited' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /invite/viewers/:docId — who has viewed this doc
router.get('/viewers/:docId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (u.id) u.id, u.name, u.email, dv.viewed_at
       FROM doc_views dv JOIN users u ON u.id = dv.user_id
       WHERE dv.doc_id=$1
       ORDER BY u.id, dv.viewed_at DESC`,
      [req.params.docId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /invite/view/:docId — log a view
router.post('/view/:docId', auth, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO doc_views (doc_id, user_id) VALUES ($1,$2)',
      [req.params.docId, req.user.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /invite/members/:docId — who has access to this doc
router.get('/members/:docId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, m.role
       FROM doc_members m JOIN users u ON u.id = m.user_id
       WHERE m.doc_id=$1`,
      [req.params.docId]
    )
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /invite/members/:docId/:userId — remove access
router.delete('/members/:docId/:userId', auth, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM doc_members WHERE doc_id=$1 AND user_id=$2',
      [req.params.docId, req.params.userId]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
