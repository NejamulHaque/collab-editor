import { useEffect, useRef, useState, useCallback } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { yCollab, yUndoManagerKeymap } from 'y-codemirror.next'
import { keymap } from '@codemirror/view'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { rust } from '@codemirror/lang-rust'
import { sql } from '@codemirror/lang-sql'
import { markdown } from '@codemirror/lang-markdown'
import { php } from '@codemirror/lang-php'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'

const USER_COLORS = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899']
const randomColor = () => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]

// All supported languages
export const LANGUAGES = [
  { id: 'auto',       label: 'Auto detect',  ext: [],              lang: () => javascript() },
  { id: 'javascript', label: 'JavaScript',   ext: ['js','jsx','mjs'], lang: () => javascript({ jsx: true }) },
  { id: 'typescript', label: 'TypeScript',   ext: ['ts','tsx'],    lang: () => javascript({ typescript: true, jsx: true }) },
  { id: 'python',     label: 'Python',       ext: ['py'],          lang: () => python() },
  { id: 'html',       label: 'HTML',         ext: ['html','htm'],  lang: () => html() },
  { id: 'css',        label: 'CSS',          ext: ['css','scss'],  lang: () => css() },
  { id: 'json',       label: 'JSON',         ext: ['json'],        lang: () => json() },
  { id: 'java',       label: 'Java',         ext: ['java'],        lang: () => java() },
  { id: 'cpp',        label: 'C/C++',        ext: ['cpp','c','h'], lang: () => cpp() },
  { id: 'rust',       label: 'Rust',         ext: ['rs'],          lang: () => rust() },
  { id: 'sql',        label: 'SQL',          ext: ['sql'],         lang: () => sql() },
  { id: 'markdown',   label: 'Markdown',     ext: ['md'],          lang: () => markdown() },
  { id: 'php',        label: 'PHP',          ext: ['php'],         lang: () => php() },
  { id: 'xml',        label: 'XML',          ext: ['xml','svg'],   lang: () => xml() },
  { id: 'plaintext',  label: 'Plain text',   ext: ['txt'],         lang: () => [] },
]

// Detect language from document title extension
function detectLangFromTitle(title) {
  if (!title) return null
  const ext = title.split('.').pop().toLowerCase()
  return LANGUAGES.find(l => l.ext.includes(ext)) || null
}

// Detect language from code content patterns
function detectLangFromContent(code) {
  if (!code || code.trim().length < 20) return null
  const c = code.trim()

  if (/^(import React|import \{|const \w+ = \(|function \w+\(|=>|useState|useEffect)/.test(c)) return 'javascript'
  if (/^(def |import |from |class |if __name__|print\()/.test(c)) return 'python'
  if (/^(<(!DOCTYPE|html|head|body|div)|<!-)/.test(c)) return 'html'
  if (/^(public class|import java|System\.out|@Override)/.test(c)) return 'java'
  if (/#include|std::|cout|cin|int main\(/.test(c)) return 'cpp'
  if (/^(fn |use |let mut|impl |struct |enum |pub fn)/.test(c)) return 'rust'
  if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|DROP)/i.test(c)) return 'sql'
  if (/^(\{|\[)\s*"/.test(c) && /[}\]]$/.test(c.trim())) return 'json'
  if (/^(<?php|\$\w+\s*=)/.test(c)) return 'php'
  if (/^(body|\.[\w-]+\s*\{|@media|:root)/.test(c)) return 'css'
  if (/^(#\s|##\s|\*\*|---|\[.+\]\()/.test(c)) return 'markdown'
  if (/^(<\?xml|<\w+[\s>])/.test(c)) return 'xml'
  if (/^(const|let|var|function|class|export|import)/.test(c)) return 'javascript'

  return null
}

function countWords(text) {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export function useCollabEditor(containerRef, docId, user, editable = true) {
  const [connected, setConnected] = useState(false)
  const [peers, setPeers] = useState([])
  const [wordCount, setWordCount] = useState(0)
  const [content, setContent] = useState('')
  const [detectedLang, setDetectedLang] = useState('auto')
  const [manualLang, setManualLang] = useState(null)
  const [lineWrapping, setLineWrapping] = useState(false)
  const [theme, setTheme] = useState('dark')
  const [fontSize, setFontSize] = useState(14)
  
  const viewRef = useRef(null)
  const langCompartment = useRef(new Compartment())
  const editableCompartment = useRef(new Compartment())
  const themeCompartment = useRef(new Compartment())
  const wrapCompartment = useRef(new Compartment())
  const settingsCompartment = useRef(new Compartment())
  
  const cleanupRef = useRef(null)
  const providerRef = useRef(null)
  const ydocRef = useRef(null)

  // Change language dynamically without destroying editor
  const setLanguage = useCallback((langId) => {
    setManualLang(langId === 'auto' ? null : langId)
    const langDef = LANGUAGES.find(l => l.id === langId) || LANGUAGES[0]
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: langCompartment.current.reconfigure(langDef.lang())
      })
    }
  }, [])

  // Dynamic configuration toggles
  const toggleWrapping = useCallback(() => {
    setLineWrapping(prev => {
      const next = !prev
      if (viewRef.current) {
        viewRef.current.dispatch({
          effects: wrapCompartment.current.reconfigure(next ? EditorView.lineWrapping : [])
        })
      }
      return next
    })
  }, [])

  const changeTheme = useCallback((newTheme) => {
    setTheme(newTheme)
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: themeCompartment.current.reconfigure(newTheme === 'dark' ? oneDark : [])
      })
    }
  }, [])

  const changeFontSize = useCallback((size) => {
    setFontSize(size)
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: settingsCompartment.current.reconfigure(EditorView.theme({
          "&": { fontSize: `${size}px` },
          ".cm-scroller": { fontFamily: 'var(--font-mono, monospace)' }
        }))
      })
    }
  }, [])

  // Sync editability
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.dispatch({
        effects: editableCompartment.current.reconfigure(EditorView.editable.of(editable))
      })
    }
  }, [editable])

  useEffect(() => {
    if (!containerRef.current || !docId || !user) return
    containerRef.current.innerHTML = ''

    const ydoc = new Y.Doc()
    const ytext = ydoc.getText('content')

    const token = localStorage.getItem('token')
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:1234'
    const provider = new WebsocketProvider(wsUrl, `doc-${docId}`, ydoc, { params: { token } })

    const color = randomColor()
    provider.awareness.setLocalStateField('user', { name: user.name, color, colorLight: color + '33' })
    provider.on('status', ({ status }) => setConnected(status === 'connected'))
    provider.awareness.on('change', () => {
      const states = []
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId !== ydoc.clientID && state.user) states.push({ ...state.user, clientId })
      })
      setPeers(states)
    })

    providerRef.current = provider
    ydocRef.current = ydoc

    const undoManager = new Y.UndoManager(ytext)
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

    let autoDetectTimeout = null

    const view = new EditorView({
      state: EditorState.create({
        extensions: [
          basicSetup,
          editableCompartment.current.of(EditorView.editable.of(editable)),
          langCompartment.current.of(javascript({ jsx: true })),
          themeCompartment.current.of(isDark ? oneDark : []),
          wrapCompartment.current.of(lineWrapping ? EditorView.lineWrapping : []),
          settingsCompartment.current.of(EditorView.theme({
            "&": { fontSize: `${fontSize}px` },
            ".cm-scroller": { fontFamily: 'var(--font-mono, monospace)' }
          })),
          keymap.of(yUndoManagerKeymap),
          yCollab(ytext, provider.awareness, { undoManager }),
          EditorView.updateListener.of(update => {
            if (update.docChanged) {
              const text = update.state.doc.toString()
              setContent(text)
              setWordCount(countWords(text))

              // Auto-detect language from content (debounced, only if not manually set)
              if (!manualLang) {
                clearTimeout(autoDetectTimeout)
                autoDetectTimeout = setTimeout(() => {
                  const detected = detectLangFromContent(text)
                  if (detected) {
                    setDetectedLang(detected)
                    const langDef = LANGUAGES.find(l => l.id === detected)
                    if (langDef) {
                      view.dispatch({ effects: langCompartment.current.reconfigure(langDef.lang()) })
                    }
                  }
                }, 600)
              }
            }
          })
        ]
      }),
      parent: containerRef.current
    })

    viewRef.current = view

    // Observe ytext for content updates
    ytext.observe(() => {
      const text = ytext.toString()
      setContent(text)
      setWordCount(countWords(text))
    })

    cleanupRef.current = () => {
      clearTimeout(autoDetectTimeout)
      view.destroy()
      provider.destroy()
      ydoc.destroy()
    }

    return () => { if (cleanupRef.current) cleanupRef.current() }
  }, [docId, user?.id])

  return {
    connected,
    peers,
    wordCount,
    content,
    detectedLang: manualLang || detectedLang,
    setLanguage,
    lineWrapping,
    toggleWrapping,
    theme,
    changeTheme,
    fontSize,
    changeFontSize,
    viewRef,
    providerRef,
    ydocRef,
  }
}