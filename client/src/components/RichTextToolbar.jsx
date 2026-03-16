import { useCallback, useRef, useState } from 'react'

export default function RichTextToolbar({ editor }) {
  const fileInputRef = useRef(null)
  const [showDeveloper, setShowDeveloper] = useState(false)

  if (!editor) return null

  const handleImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.name.endsWith('.docx')) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const mammoth = await import('mammoth/mammoth.browser.js')
          const result = await mammoth.convertToHtml({ arrayBuffer: e.target.result })
          editor.commands.setContent(result.value)
        } catch (err) {
          alert('Failed to parse Word document.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else if (file.name.endsWith('.pdf')) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const pdfjsLib = await import('pdfjs-dist/build/pdf')
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
          const typedarray = new Uint8Array(e.target.result)
          const pdf = await pdfjsLib.getDocument(typedarray).promise
          let extractedHtml = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const textLines = textContent.items.map(item => item.str).join(' ')
            extractedHtml += `<p>${textLines}</p>`
          }
          editor.commands.setContent(extractedHtml)
        } catch (err) {
          alert('Failed to parse PDF document.')
        }
      }
      reader.readAsArrayBuffer(file)
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv')) {
       alert('Spreadsheets are not natively supported in the Rich Text Editor yet. Please copy and paste tables.')
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        editor.commands.setContent(e.target.result)
      }
      reader.readAsText(file)
    }
  }

  const exportPDF = () => {
    window.print() // Best quality native PDF generation
  }

  const exportWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>"
    const footer = "</body></html>"
    const sourceHTML = header + editor.getHTML() + footer
    const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML)
    const fileDownload = document.createElement("a")
    fileDownload.href = source
    fileDownload.download = 'document.doc'
    fileDownload.click()
  }

  const addImage = useCallback(() => {
    const url = window.prompt('URL of the image:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addYoutube = useCallback(() => {
    const url = window.prompt('URL of the YouTube video:')
    if (url) {
      editor.chain().focus().setYoutubeVideo({ src: url }).run()
    }
  }, [editor])

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL:', previousUrl)
    // cancelled
    if (url === null) {
      return
    }
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const [activeMenu, setActiveMenu] = useState(null)
  
  const menuOptions = {
    'File': [
      { label: 'New', action: () => window.open('/dashboard', '_blank') },
      { label: 'Import Docs', action: () => fileInputRef.current?.click() },
      { label: 'Download as PDF', action: exportPDF },
      { label: 'Download as Word', action: exportWord },
    ],
    'Edit': [
      { label: 'Undo', action: () => editor.chain().focus().undo().run() },
      { label: 'Redo', action: () => editor.chain().focus().redo().run() },
      { label: 'Cut', action: () => document.execCommand('cut') },
      { label: 'Copy', action: () => document.execCommand('copy') },
    ],
    'Insert': [
      { label: 'Image', action: addImage },
      { label: 'Link', action: setLink },
      { label: 'Table (3x3)', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: 'YouTube Video', action: addYoutube }
    ],
    'Format': [
      { label: 'Bold', action: () => editor.chain().focus().toggleBold().run() },
      { label: 'Italic', action: () => editor.chain().focus().toggleItalic().run() },
      { label: 'Underline', action: () => editor.chain().focus().toggleUnderline().run() },
      { label: 'Strikethrough', action: () => editor.chain().focus().toggleStrike().run() },
      { label: 'Clear Formatting', action: () => editor.chain().focus().unsetAllMarks().run() }
    ],
    'Tools': [
      { label: 'Word Count', action: () => alert(`Word count: ${editor.storage.characterCount?.words() || 0}`) }
    ],
    'Help': [
      { label: 'CollabSheets Help', action: () => alert('Welcome to CollabSheets!') },
      { label: 'About Developer', action: () => setShowDeveloper(true) }
    ]
  }

  return (
    <div style={toolbarContainerStyle}>
      {/* Secondary Toolbar: Menus & Export */}
      <div style={actionsBarStyle}>
        
        {/* Left: Top Menus (Word style) */}
        <div style={{ display: 'flex', gap: 6, position: 'relative' }}>
          {Object.entries(menuOptions).map(([menuName, items]) => (
            <div 
              key={menuName}
              onMouseEnter={() => setActiveMenu(menuName)}
              onMouseLeave={() => setActiveMenu(null)}
              style={{ position: 'relative' }}
            >
              <button 
                style={{ ...topMenuBtnStyle, background: activeMenu === menuName ? 'var(--bg2)' : 'transparent' }}
              >
                {menuName}
              </button>
              
              {activeMenu === menuName && (
                <div style={dropdownStyle}>
                  {items.map(item => (
                    <button 
                      key={item.label} 
                      onClick={() => { item.action(); setActiveMenu(null) }}
                      style={dropdownItemStyle}
                      onMouseOver={e=>e.currentTarget.style.background='var(--bg3)'} 
                      onMouseOut={e=>e.currentTarget.style.background='transparent'}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Import/Export */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} accept=".txt,.html,.md,.docx,.pdf,.xlsx,.xls,.csv" />
          <button onClick={() => fileInputRef.current?.click()} style={outlineBtn} onMouseOver={e=>e.currentTarget.style.background='var(--bg2)'} onMouseOut={e=>e.currentTarget.style.background='var(--bg)'}>📥 Import Docs</button>
          <button onClick={exportPDF} style={outlineBtn} onMouseOver={e=>e.currentTarget.style.background='var(--bg2)'} onMouseOut={e=>e.currentTarget.style.background='var(--bg)'}>📄 Export PDF</button>
          <button onClick={exportWord} style={outlineBtn} title="Download Word (.doc)" onMouseOver={e=>e.currentTarget.style.background='var(--bg2)'} onMouseOut={e=>e.currentTarget.style.background='var(--bg)'}>📝 Export Word</button>
        </div>
      </div>

      {/* Bottom Row: Formatting Tools */}
      <div style={formattingRowStyle}>
        {/* Basic Formatting */}
        <div style={groupStyle}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">B</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic" style={{ fontStyle: 'italic' }}>I</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline" style={{ textDecoration: 'underline' }}>U</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough" style={{ textDecoration: 'line-through' }}>S</ToolbarBtn>
      </div>

      <div style={dividerStyle} />

      {/* Headings */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">H1</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">H2</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">H3</ToolbarBtn>
      </div>

      <div style={dividerStyle} />

      {/* Alignment */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">≡</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">＝</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">equiv</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">≡</ToolbarBtn>
      </div>

      <div style={dividerStyle} />

      {/* Lists & Blocks */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">•≡</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List">1.</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">""</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">&lt;/&gt;</ToolbarBtn>
      </div>

      <div style={dividerStyle} />

      {/* Media & Links */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Link">🔗</ToolbarBtn>
        <ToolbarBtn onClick={addImage} title="Image">🖼️</ToolbarBtn>
        <ToolbarBtn onClick={addYoutube} title="YouTube">▶️</ToolbarBtn>
      </div>

      <div style={dividerStyle} />

      {/* Highlight & Colors */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">🖍️</ToolbarBtn>
        <input 
          type="color" 
          onInput={event => editor.chain().focus().setColor(event.target.value).run()} 
          value={editor.getAttributes('textStyle').color || '#000000'}
          style={colorPickerStyle}
          title="Text Color"
        />
      </div>

      <div style={dividerStyle} />

      {/* Tables & Advanced */}
      <div style={groupStyle}>
        <ToolbarBtn onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">📊 Table</ToolbarBtn>
        {editor.isActive('table') && (
          <>
            <ToolbarBtn onClick={() => editor.chain().focus().addColumnBefore().run()} title="Add Col Before">+C←</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().addColumnAfter().run()} title="Add Col After">+C→</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteColumn().run()} title="Delete Col">-C</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().addRowBefore().run()} title="Add Row Before">+R↑</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().addRowAfter().run()} title="Add Row After">+R↓</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteRow().run()} title="Delete Row">-R</ToolbarBtn>
            <ToolbarBtn onClick={() => editor.chain().focus().deleteTable().run()} title="Delete Table">🗑</ToolbarBtn>
          </>
        )}
      </div>

      </div>

      {/* About Developer Modal */}
      {showDeveloper && (
        <div className="modal-backdrop" onClick={() => setShowDeveloper(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="fade-in" onClick={e => e.stopPropagation()} style={{ width: 340, background: 'var(--bg)', borderRadius: 16, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '24px 20px', textAlign: 'center', position: 'relative' }}>
               <button onClick={()=>setShowDeveloper(false)} style={{ position:'absolute', top:12, right:12, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:14 }}>✕</button>
               <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff', padding: 3, margin: '0 auto 12px' }}>
                 <img src="/H&S.png" alt="Developer" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
               </div>
               <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>Nejamul Haque</h3>
               <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 0' }}>Full Stack Developer & AI Engineer</p>
            </div>
            
            <div style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--bg2)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>GitHub</a>
                <a href="https://linkedin.com/in/nejamulhaque" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--bg2)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>LinkedIn</a>
                <a href="https://portfolio-nejamulhaque.vercel.app/" target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px 0', textAlign: 'center', background: 'var(--bg2)', color: 'var(--text)', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid var(--border)' }}>Portfolio</a>
              </div>

              <div style={{ textAlign: 'center', padding: 16, background: 'var(--bg2)', borderRadius: 12, border: '1px dashed var(--border2)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Support my work ☕</h4>
                <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 12px', lineHeight: 1.4 }}>If you find CollabSheets helpful, consider supporting its development!</p>
                <div style={{ background: '#fff', padding: 8, display: 'inline-block', borderRadius: 8, boxShadow: 'var(--shadow)', marginBottom: 8 }}>
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=nejamulhaque@freecharge&pn=Nejamul%20Haque&cu=INR`} alt="UPI QR Code" style={{ width: 120, height: 120, display: 'block' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, letterSpacing: 0.5 }}>SCAN TO PAY VIA UPI</div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

function ToolbarBtn({ children, onClick, active, title, style }) {
  return (
    <button 
      onClick={onClick} 
      title={title}
      style={{
        ...btnStyle,
        background: active ? 'var(--bg3)' : 'transparent',
        color: active ? 'var(--text)' : 'var(--text2)',
        fontWeight: active ? 'bold' : 'normal',
        ...style
      }}
    >
      {children}
    </button>
  )
}

const toolbarContainerStyle = { 
  display: 'flex', 
  flexDirection: 'column',
  background: 'var(--bg)', 
  borderBottom: '1px solid var(--border)',
  position: 'sticky',
  top: 0,
  zIndex: 10
}
const actionsBarStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '6px 16px',
  background: 'var(--bg)',
  borderBottom: '1px solid var(--border)',
}
const formattingRowStyle = {
  display: 'flex', 
  flexWrap: 'wrap', 
  gap: '8px', 
  padding: '8px 16px', 
  alignItems: 'center',
  background: 'var(--bg2)'
}
const topMenuBtnStyle = { padding: '4px 10px', fontSize: 13, color: 'var(--text2)', background: 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }
const dropdownStyle = { position: 'absolute', top: '100%', left: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '4px 0', minWidth: 160, zIndex: 100 }
const dropdownItemStyle = { display: 'block', width: '100%', textAlign: 'left', padding: '6px 16px', fontSize: 13, color: 'var(--text)', background: 'transparent', border: 'none', cursor: 'pointer' }
const groupStyle = { display: 'flex', gap: '2px', alignItems: 'center' }
const dividerStyle = { width: '1px', height: '24px', background: 'var(--border)', margin: '0 6px' }
const btnStyle = { padding: '5px 8px', borderRadius: '4px', border: '1px solid transparent', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s' }
const outlineBtn = { padding: '6px 14px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text)', transition: 'all 0.1s' }
const ghostBtn = { display:'flex', alignItems:'center', gap:5, padding:'5px 10px', borderRadius:8, border:'none', background:'none', cursor:'pointer', color:'var(--text2)', fontSize:13, fontWeight:600, flexShrink:0, transition:'background .1s' }
const colorPickerStyle = { cursor: 'pointer', border: 'none', background: 'transparent', width: '24px', height: '24px', padding: 0 }
