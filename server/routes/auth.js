const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body
  try {
    const hashed = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, hashed]
    )
    const user = result.rows[0]
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user })
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).json({ error: 'Email already exists' })
    } else {
      console.error('Registration DB Error:', err)
      res.status(500).json({ error: 'Database error: ' + err.message })
    }
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/google', async (req, res) => {
  const { name, email, uid } = req.body
  if (!email || !uid) return res.status(400).json({ error: 'Missing Google payload' })

  try {
    // 1. Check if user already exists
    let result = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    let user = result.rows[0]

    // 2. If not, auto-provision their account
    if (!user) {
      // Generate an impossible-to-guess password hash since they use Google
      const randomPassword = require('crypto').randomBytes(32).toString('hex')
      const hashed = await bcrypt.hash(randomPassword, 10)
      
      result = await pool.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
        [name || 'Google User', email, hashed]
      )
      user = result.rows[0]
    }

    // 3. Issue standard CollabSheets JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })

  } catch (err) {
    console.error('Google Auth Error:', err)
    res.status(500).json({ error: 'Server error during Google authentication' })
  }
})

module.exports = router