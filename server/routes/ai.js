const router = require('express').Router()
const auth = require('../middleware/auth')

// POST /ai/chat — proxy to OpenAI-compatible or Gemini API
router.post('/chat', auth, async (req, res) => {
  const { messages, code, language } = req.body
  if (!messages && !code) return res.status(400).json({ error: 'No prompt supplied' })

  const apiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) {
    // Return a mock response when no key is configured so UI still works
    return res.json({
      reply: "⚠️ No AI API key configured. Add OPENAI_API_KEY or GEMINI_API_KEY to server/.env to enable AI features.",
    })
  }

  try {
    const systemPrompt = `You are an expert coding assistant embedded inside a collaborative code editor.
The user is editing ${language || 'code'}. Be concise, helpful, and provide code examples when useful.`

    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...(code ? [{ role: 'user', content: `Here is my current code:\n\`\`\`${language || ''}\n${code}\n\`\`\`` }] : []),
      ...(messages || []),
    ]

    // Supports OpenAI-compatible endpoints (OpenAI, local Ollama, etc.)
    if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({ model: 'gpt-4o-mini', messages: fullMessages, max_tokens: 1024 }),
      })
      const data = await response.json()
      return res.json({ reply: data.choices?.[0]?.message?.content || 'No response.' })
    }

    // Gemini fallback
    if (process.env.GEMINI_API_KEY) {
      const contents = fullMessages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, systemInstruction: { parts: [{ text: systemPrompt }] } }),
        }
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
      return res.json({ reply: text })
    }
  } catch (err) {
    console.error('AI route error:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
