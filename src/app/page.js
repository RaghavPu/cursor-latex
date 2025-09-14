'use client';

import { useState, useRef, useEffect } from 'react';
import LatexEditor from '../components/LatexEditor';
import AIChat from '../components/AIChat';
import ResizableDivider from '../components/ResizableDivider';
import { initializeDocument } from '../lib/simpleAgent';

export default function Home() {
  const [title, setTitle] = useState('My LaTeX Document');
  const [content, setContent] = useState(`\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{amsfonts}
\\usepackage{amssymb}

\\title{Sample LaTeX Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a sample LaTeX document. You can write mathematical expressions like $E = mc^2$ inline, or display them in blocks:

\\[
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
\\]

\\section{More Examples}
Here are some more mathematical expressions:

\\begin{align}
f(x) &= ax^2 + bx + c \\\\\ng(x) &= \\sin(x) + \\cos(x) \\\\\nh(x) &= \\frac{1}{x^2 + 1}
\\end{align}

\\section{Lists and Text}
\\begin{itemize}
\\item First item
\\item Second item with $\\alpha + \\beta = \\gamma$
\\item Third item
\\end{itemize}

\\end{document}`);
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [hasCompiled, setHasCompiled] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledPdfUrl, setCompiledPdfUrl] = useState('');
  const [compileLog, setCompileLog] = useState('');
  const [aiChatWidth, setAiChatWidth] = useState(320); // Default width for AI chat pane
  const titleRef = useRef(null);
  const editorRef = useRef(null);
  
  // No complex hooks needed

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };
    
    checkDarkMode();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => mediaQuery.removeEventListener('change', checkDarkMode);
  }, []);

  // Auto-focus title on load
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  // Initialize simple agent
  useEffect(() => {
    console.log('[Page] Initializing simple agent with content');
    initializeDocument(content, (newContent) => {
      console.log('[Page] AI updated document, syncing to React state');
      setContent(newContent);
    });
  }, []); // Only run once on mount

  // Handle typing indicators
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  // Editor returns the new value as a string
  const handleContentChange = (val) => {
    setContent(val);
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
    
    // Update simple agent with new content
    initializeDocument(val, (newContent) => {
      setContent(newContent);
    });
  };

  // Compile LaTeX to PDF via internal API route
  const compileLatex = async () => {
    setHasCompiled(true);
    setIsCompiling(true);
    setCompileLog('');
    setCompiledPdfUrl('');

    try {
      const resp = await fetch('/api/latex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!resp.ok) {
        let msg = 'Compilation failed';
        try {
          const data = await resp.json();
          msg = data?.error || msg;
        } catch {}
        setCompileLog(msg);
        setCompiledPdfUrl('');
      } else {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        setCompiledPdfUrl(url);
        setCompileLog('');
      }
    } catch (error) {
      setCompileLog(`Compilation error: ${error.message}`);
      setCompiledPdfUrl('');
    } finally {
      setIsCompiling(false);
    }
  };

  // Handle tab and save shortcut
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      compileLatex();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = content.substring(0, start) + '    ' + content.substring(end);
      setContent(newValue);
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 1000);
      requestAnimationFrame(() => {
        try {
          textarea.selectionStart = textarea.selectionEnd = start + 4;
        } catch {}
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#191919] transition-colors duration-200">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#191919]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.5 3h15l-3.5 9h-8l-3.5-9zm8 12c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              LaTeX Editor
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {title || 'Untitled'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {isTyping && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                <span>Editing...</span>
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {content.length} characters
            </div>
          </div>
        </div>
      </div>

      {/* Three-Pane Layout: AI Chat | Editor | PDF Preview */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Side - AI Chat with Resizable Divider */}
        <ResizableDivider
          onResize={setAiChatWidth}
          minWidth={280}
          maxWidth={600}
          defaultWidth={aiChatWidth}
          className="flex-shrink-0"
        >
          <AIChat 
            isDark={isDark}
          />
        </ResizableDivider>

        {/* Center - Editor */}
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700 flex flex-col min-w-0">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Document Title"
              className="w-full text-2xl font-bold text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent border-none outline-none"
            />
          </div>
          
          <div className="flex-1 p-6 overflow-auto">
            <LatexEditor
              ref={editorRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Write your LaTeX code here..."
              className="w-full h-full"
              isDark={isDark}
            />
          </div>
        </div>

        {/* Right Side - PDF Preview / Errors */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between flex-shrink-0">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {!hasCompiled ? 'Preview' : (compileLog ? 'Errors' : 'PDF Preview')}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">Press ⌘S / Ctrl+S to compile</span>
          </div>
          
          <div className="flex-1 bg-white dark:bg-[#1a1a1a] overflow-auto">
            {!hasCompiled ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4.5 3h15l-3.5 9h-8l-3.5-9zm8 12c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z"/>
                  </svg>
                  <p className="text-lg mb-2">Ready to compile</p>
                  <p className="text-sm">Press ⌘S or Ctrl+S to render your PDF</p>
                </div>
              </div>
            ) : isCompiling ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin h-8 w-8 rounded-full border-2 border-gray-300 border-t-transparent"></div>
              </div>
            ) : compileLog ? (
              <div className="p-6 h-full">
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Compilation Errors:</h4>
                </div>
                <pre className="text-sm whitespace-pre-wrap text-red-700 dark:text-red-300">{compileLog}</pre>
              </div>
            ) : compiledPdfUrl ? (
              <object data={compiledPdfUrl} type="application/pdf" className="w-full h-full">
                <div className="p-6 text-sm text-gray-600 dark:text-gray-300">
                  PDF preview is not supported in this browser. 
                  <a className="underline" href={compiledPdfUrl} target="_blank" rel="noreferrer">Open the PDF</a> instead.
                </div>
              </object>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div>No output yet.</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
