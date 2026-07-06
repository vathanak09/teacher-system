"use client";

import React, { useState, useRef, useEffect } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import ReactQuill from 'react-quill-new';

// Register fonts and sizes globally if window exists
if (typeof window !== 'undefined') {
  const Quill = require('react-quill-new').Quill;
  
  const Font = Quill.import('formats/font');
  Font.whitelist = ['sans-serif', 'battambang', 'kantumruy-pro', 'moul', 'suwannaphum', 'hanuman', 'chenla', 'fasthand', 'inter', 'roboto'];
  Quill.register(Font, true);

  const Size = Quill.import('attributors/style/size');
  Size.whitelist = ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'];
  Quill.register(Size, true);
}

interface AdvancedEditorProps {
  content: string;
  onChange: (val: string) => void;
  embeddedCodes: string[];
  onEmbeddedCodesChange: (codes: string[]) => void;
  placeholder?: string;
}

export default function AdvancedEditor({ content, onChange, embeddedCodes, onEmbeddedCodesChange, placeholder }: AdvancedEditorProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [viewMode, setViewMode] = useState<'word' | 'html' | 'both'>('word');
  const [codeToEmbed, setCodeToEmbed] = useState('');
  const quillRef = useRef<any>(null);

  const modules = {
    toolbar: [
      [{ 'font': ['sans-serif', 'battambang', 'kantumruy-pro', 'moul', 'suwannaphum', 'hanuman', 'chenla', 'fasthand', 'inter', 'roboto'] }],
      [{ 'size': ['12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }, { 'align': [] }],
      ['link', 'image', 'video'],
      ['clean']
    ],
  };

  const handleInsertCode = () => {
    if (!codeToEmbed.trim()) return;
    
    // Add to embedded codes array so it's not lost
    const newCodes = [...(embeddedCodes || []), codeToEmbed.trim()];
    onEmbeddedCodesChange(newCodes);

    // Insert into editor
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      const range = editor.getSelection(true);
      editor.clipboard.dangerouslyPasteHTML(range.index, codeToEmbed.trim());
      // Move cursor past the embedded code
      editor.setSelection(range.index + 1);
    } else {
      // Fallback if not in word mode
      onChange(content + '\\n' + codeToEmbed.trim());
    }

    setCodeToEmbed('');
  };

  const handleRemoveEmbeddedCode = (index: number) => {
    const newCodes = [...(embeddedCodes || [])];
    newCodes.splice(index, 1);
    onEmbeddedCodesChange(newCodes);
  };

  const handleUpdateEmbeddedCode = (index: number, newCode: string) => {
    const newCodes = [...(embeddedCodes || [])];
    newCodes[index] = newCode;
    onEmbeddedCodesChange(newCodes);
  };

  if (!mounted) return <div style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>កំពុងផ្ទុកផ្ទាំងសរសេរ...</div>;

  return (
    <div className="advanced-editor" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Toolbars & Mode Selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" onClick={() => setViewMode('html')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: viewMode === 'html' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'html' ? 'white' : 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>HTML Style</button>
          <button type="button" onClick={() => setViewMode('both')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: viewMode === 'both' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'both' ? 'white' : 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Both</button>
          <button type="button" onClick={() => setViewMode('word')} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: viewMode === 'word' ? 'var(--primary-color)' : 'transparent', color: viewMode === 'word' ? 'white' : 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Word Style</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
          <input 
            type="text" 
            placeholder="បញ្ចូល Embed កូដ (ឧ. iframe youtube...)" 
            value={codeToEmbed}
            onChange={(e) => setCodeToEmbed(e.target.value)}
            style={{ flex: 1, padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)' }}
          />
          <button 
            type="button" 
            onClick={handleInsertCode}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            បញ្ចូលកូដ
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div style={{ display: 'flex', gap: '1rem', flexDirection: viewMode === 'both' ? (typeof window !== 'undefined' && window.innerWidth < 768 ? 'column' : 'row') : 'column' }}>
        
        {/* HTML Mode */}
        {(viewMode === 'html' || viewMode === 'both') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {viewMode === 'both' && <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>HTML Style</div>}
            <textarea 
              value={content} 
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder || "សរសេរកូដ HTML ទីនេះ..."}
              style={{ width: '100%', minHeight: '400px', flex: 1, padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#1e1e1e', color: '#d4d4d4', fontFamily: 'monospace', fontSize: '14px', lineHeight: 1.5, resize: 'vertical' }}
            />
          </div>
        )}

        {/* Word Mode */}
        {(viewMode === 'word' || viewMode === 'both') && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {viewMode === 'both' && <div style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Word Style</div>}
            <div style={{ background: 'var(--main-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
              <ReactQuill 
                ref={quillRef}
                theme="snow" 
                value={content} 
                onChange={onChange} 
                modules={modules}
                placeholder={placeholder || "សរសេរអត្ថបទទីនេះ..."}
                style={{ height: '350px' }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Embedded Codes Manager */}
      {embeddedCodes && embeddedCodes.length > 0 && (
        <div style={{ marginTop: '1rem', background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
          <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
            កូដដែលបានបញ្ចូល (Embeds)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {embeddedCodes.map((code, index) => (
              <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <textarea 
                  value={code}
                  onChange={(e) => handleUpdateEmbeddedCode(index, e.target.value)}
                  style={{ flex: 1, minHeight: '60px', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--main-bg)', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}
                />
                <button 
                  type="button"
                  onClick={() => handleRemoveEmbeddedCode(index)}
                  style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                  title="លុបកូដនេះ"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', marginBottom: 0 }}>
            * កូដទាំងនេះត្រូវបានរក្សាទុកដោយឡែក ដើម្បីការពារកុំឲ្យបាត់បង់នៅពេលកែប្រែក្នុង Word Style។ លោកអ្នកអាចកែប្រែកូដដើមនៅទីនេះដោយផ្ទាល់។
          </p>
        </div>
      )}

    </div>
  );
}
