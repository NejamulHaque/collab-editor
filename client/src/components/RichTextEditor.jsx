import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'

import RichTextToolbar from './RichTextToolbar'

const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
function getPeerColor(name) {
  let hash = 0
  for (const c of (name || '')) hash = c.charCodeAt(0) + (hash * 31)
  return colors[Math.abs(hash) % colors.length]
}

export default function RichTextEditor({ ydocRef, providerRef, user, editable = true }) {
  const containerRef = useRef(null)

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        // The Collaboration extension comes with its own history handling
        history: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight,
      Image,
      Link.configure({ openOnClick: true }),
      Youtube.configure({ width: 480, height: 320 }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // Wire up Yjs collaboration if references exist
      ...(ydocRef?.current && providerRef?.current ? [
        Collaboration.configure({
          document: ydocRef.current,
          field: 'prosemirror',
        }),
        CollaborationCursor.configure({
          provider: providerRef.current,
          user: {
            name: user?.name || 'Anonymous',
            color: getPeerColor(user?.name),
          },
        }),
      ] : []),
    ],
    // Let Yjs handle initial content
  })

  // Sync editability if it changes dynamically after mount
  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable)
    }
  }, [editor, editable])

  // Basic styling for the editor content area
  // (We use a dynamic style block to target ProseMirror classes)
  return (
    <div className="rich-text-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, width: '100%' }}>
      <style>{`
        .rich-text-container .ProseMirror {
          flex: 1;
          padding: 2.5rem 4rem;
          outline: none;
          max-width: 900px;
          margin: 0 auto;
          background: var(--bg);
          color: var(--text);
          font-family: var(--font);
          font-size: 15px;
          line-height: 1.6;
          min-height: 100vh;
          box-shadow: 0 0 10px rgba(0,0,0,0.05);
        }
        .rich-text-container .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text3);
          pointer-events: none;
          height: 0;
        }
        /* Tables */
        .rich-text-container .ProseMirror table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 0;
          overflow: hidden;
        }
        .rich-text-container .ProseMirror td,
        .rich-text-container .ProseMirror th {
          min-width: 1em;
          border: 1px solid var(--border);
          padding: 6px 10px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .rich-text-container .ProseMirror th {
          background-color: var(--bg2);
          font-weight: bold;
          text-align: left;
        }
        /* Images & Videos */
        .rich-text-container .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }
        .rich-text-container .ProseMirror iframe {
          border: none;
          border-radius: 4px;
        }
        /* Collaboration cursors */
        .collaboration-cursor__caret {
          border-left: 2px solid #0d0d0d;
          border-right: 2px solid #0d0d0d;
          margin-left: -2px;
          margin-right: -2px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }
        .collaboration-cursor__label {
          border-radius: 3px 3px 3px 0;
          color: #fff;
          font-size: 11px;
          font-style: normal;
          font-weight: 600;
          left: -2px;
          line-height: normal;
          padding: 2px 6px;
          position: absolute;
          top: -1.6em;
          user-select: none;
          white-space: nowrap;
        }
      `}</style>

      {editable && <RichTextToolbar editor={editor} />}
      
      <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg2)' }} ref={containerRef}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
