const router = require('express').Router()
const auth = require('../middleware/auth')
const { execFile, exec, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const os = require('os')

// Docker-based config (used when Docker available)
const DOCKER_CONFIG = {
  python:     { image: 'python:3.11-slim',  ext: 'py',  cmd: ['python', '/code/main.py'] },
  javascript: { image: 'node:20-alpine',     ext: 'js',  cmd: ['node', '/code/main.js'] },
  typescript: { image: 'node:20-alpine',     ext: 'ts',  cmd: ['npx', 'ts-node', '/code/main.ts'] },
  java:       { image: 'openjdk:21-slim',    ext: 'java',cmd: ['bash', '-c', 'cd /code && javac Main.java && java Main'] },
  cpp:        { image: 'gcc:13',             ext: 'cpp', cmd: ['bash', '-c', 'g++ /code/main.cpp -o /code/a.out && /code/a.out'] },
  rust:       { image: 'rust:slim',          ext: 'rs',  cmd: ['bash', '-c', 'rustc /code/main.rs -o /code/a.out && /code/a.out'] },
  bash:       { image: 'bash:latest',        ext: 'sh',  cmd: ['bash', '/code/main.sh'] },
}

// Local fallback — runs directly on host via child_process
const LOCAL_CONFIG = {
  python:     { ext: 'py',  cmd: 'python3', args: (f) => [f] },
  javascript: { ext: 'js',  cmd: 'node',    args: (f) => [f] },
  bash:       { ext: 'sh',  cmd: 'bash',    args: (f) => [f] },
}

function commandExists(cmd) {
  return new Promise(resolve => {
    exec(`which ${cmd}`, (err) => resolve(!err))
  })
}

// Run a process with stdin piped, returns { stdout, stderr, exitCode }
function runWithStdin(cmd, args, stdinData, timeout = 15000) {
  return new Promise((resolve) => {
    let stdout = '', stderr = ''
    const proc = spawn(cmd, args, { timeout })

    proc.stdout.on('data', (d) => { stdout += d.toString() })
    proc.stderr.on('data', (d) => { stderr += d.toString() })

    proc.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 })
    })
    proc.on('error', (err) => {
      resolve({ stdout, stderr: stderr || err.message, exitCode: 1 })
    })

    // Timeout handler
    const timer = setTimeout(() => {
      proc.kill('SIGKILL')
      resolve({ stdout, stderr: stderr + '\nExecution timed out (15s limit)', exitCode: -1 })
    }, timeout)

    proc.on('close', () => clearTimeout(timer))

    // Write stdin and close
    if (stdinData) {
      proc.stdin.write(stdinData)
    }
    proc.stdin.end()
  })
}

router.post('/run', auth, async (req, res) => {
  const { code, language, stdin } = req.body
  if (!code || !language) return res.status(400).json({ error: 'code and language are required' })

  const dockerConfig = DOCKER_CONFIG[language]
  if (!dockerConfig) return res.status(400).json({ error: `Language '${language}' not supported for execution` })

  // Check Docker availability
  const dockerAvailable = await new Promise(resolve => {
    exec('docker info', (err) => resolve(!err))
  })

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'collab-run-'))
  const filename = language === 'java' ? 'Main.java' : `main.${dockerConfig.ext}`
  const filePath = path.join(tmpDir, filename)

  try {
    fs.writeFileSync(filePath, code, 'utf-8')

    // ===== Docker execution (secure sandbox) =====
    if (dockerAvailable) {
      const result = await new Promise((resolve) => {
        const args = [
          'run', '--rm', '-i',
          '--cpus', '0.5',
          '--memory', '128m',
          '--network', 'none',
          '--read-only',
          '--tmpfs', '/tmp',
          '-v', `${tmpDir}:/code:ro`,
          dockerConfig.image,
          ...dockerConfig.cmd,
        ]
        const proc = spawn('docker', args, { timeout: 15000 })
        let stdout = '', stderr = ''

        proc.stdout.on('data', (d) => { stdout += d.toString() })
        proc.stderr.on('data', (d) => { stderr += d.toString() })

        proc.on('close', (code) => {
          resolve({ stdout, stderr, exitCode: code || 0 })
        })
        proc.on('error', (err) => {
          resolve({ stdout, stderr: stderr || err.message, exitCode: 1 })
        })

        const timer = setTimeout(() => {
          proc.kill('SIGKILL')
          resolve({ stdout, stderr: stderr + '\nExecution timed out (15s limit)', exitCode: -1 })
        }, 15000)
        proc.on('close', () => clearTimeout(timer))

        // Pipe stdin
        if (stdin) proc.stdin.write(stdin)
        proc.stdin.end()
      })
      return res.json(result)
    }

    // ===== Local fallback (no Docker) =====
    const localConfig = LOCAL_CONFIG[language]
    if (!localConfig) {
      return res.json({
        stdout: '',
        stderr: `⚠️ Docker is not available. Local execution only supports: ${Object.keys(LOCAL_CONFIG).join(', ')}.\nThe '${language}' runtime is not configured for local execution.`,
        exitCode: -1,
      })
    }

    const runtimeExists = await commandExists(localConfig.cmd)
    if (!runtimeExists) {
      return res.json({
        stdout: '',
        stderr: `⚠️ Runtime '${localConfig.cmd}' is not installed on this server.\nInstall it or use Docker for full language support.`,
        exitCode: -1,
      })
    }

    // Execute locally with stdin support
    const result = await runWithStdin(localConfig.cmd, localConfig.args(filePath), stdin || '', 15000)
    result.mode = '⚡ Local execution'
    return res.json(result)

  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true }) } catch {}
  }
})

module.exports = router
