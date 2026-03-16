require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

async function migrate() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is missing!')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Required for Render Postgres outside Render network
  })

  try {
    console.log('Connecting to database...')
    const sqlDir = path.join(__dirname, 'migrations')
    const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort()

    for (const file of files) {
      console.log(`Executing ${file}...`)
      const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8')
      await pool.query(sql)
      console.log(`✅ ${file} applied successfully.`)
    }

    console.log('🎉 All migrations applied successfully!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  } finally {
    await pool.end()
  }
}

module.exports = migrate
