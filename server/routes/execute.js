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
  python:     { ext: 'py',   cmd: 'python3', args: (f) => [f] },
  javascript: { ext: 'js',   cmd: 'node',    args: (f) => [f] },
  bash:       { ext: 'sh',   cmd: 'bash',    args: (f) => [f] },
  cpp:        { ext: 'cpp',  cmd: 'bash',    args: (f) => ['-c', `g++ ${f} -o ${f}.out && ${f}.out`] },
  java:       { ext: 'java', cmd: 'bash',    args: (f) => ['-c', `javac ${f} && java -cp ${path.dirname(f)} Main`] },
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

    // ===== Fast Local Path (Preferred for speed if runtime exists) =====
    const localConfig = LOCAL_CONFIG[language]
    if (localConfig) {
      const runtimeExists = await commandExists(localConfig.cmd)
      if (runtimeExists) {
        const result = await runWithStdin(localConfig.cmd, localConfig.args(filePath), stdin || '', 15000)
        result.mode = '⚡ Local Fast Path'
        return res.json(result)
      }
    }

    // ===== Docker Path (Secure fallback/sandbox) =====
    if (dockerAvailable) {
      const result = await new Promise((resolve) => {
        const args = [
          'run', '--rm', '-i',
          '--cpus', '0.5',
          '--memory', '128m',
          '--network', 'none',
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

        if (stdin) proc.stdin.write(stdin)
        proc.stdin.end()
      })
      result.mode = '🐳 Docker Sandbox'
      return res.json(result)
    }

    res.json({
      stdout: '',
      stderr: `⚠️ No local runtime or Docker found for '${language}'.`,
      exitCode: -1
    })

  } catch (err) {
    res.status(500).json({ error: err.message })
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true }) } catch {}
  }
})

module.exports = router
