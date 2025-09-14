'use client';

import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-latex';
import 'prismjs/themes/prism.css';

import { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';

const LatexEditor = forwardRef(function LatexEditor({ 
  value, 
  onChange, 
  onKeyDown, 
  placeholder = "Write your LaTeX code here...",
  className = "",
  isDark = false 
}, ref) {
  const internalRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getCursorPosition: () => {
      const ta = internalRef.current?._input || internalRef.current?.textarea || null;
      if (!ta) return 0;
      try { return ta.selectionStart || 0; } catch { return 0; }
    }
  }), []);
  return (
    <div className={`${className}`} style={{ position: 'relative' }}>
      {!value && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            color: isDark ? '#6b7280' : '#9ca3af',
            pointerEvents: 'none',
            fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
            fontSize: 14,
            lineHeight: 1.5,
            padding: 0,
            whiteSpace: 'pre-wrap'
          }}
        >
          {placeholder}
        </div>
      )}

      <Editor
        ref={internalRef}
        value={value}
        onValueChange={onChange}
        highlight={(code) => Prism.highlight(code, Prism.languages.latex, 'latex')}
        padding={0}
        className="latex-editor"
        textareaClassName="latex-editor"
        preClassName="latex-editor"
        style={{
          fontFamily: 'Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
          fontSize: 14,
          lineHeight: 1.5,
          tabSize: 2
        }}
        onKeyDown={onKeyDown}
      />
    </div>
  );
});

export default LatexEditor;