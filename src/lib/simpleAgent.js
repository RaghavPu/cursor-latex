/**
 * Simple AI Agent - First Principles Approach
 * Just stores document content and lets AI read/write it
 */

import { parseLatexDiff, applyLatexDiffs, previewLatexDiffs, hasLatexDiffs, extractRegularLatexBlocks } from './latexDiff.js';

// Global document store
let documentContent = '';
let changeCallback = null;

// Undo history
let undoHistory = [];
const MAX_UNDO_HISTORY = 20;

/**
 * Initialize with document content
 */
export function initializeDocument(content, onChangeCallback) {
  documentContent = content || '';
  changeCallback = onChangeCallback;
  console.log('[SimpleAgent] Initialized with', documentContent.length, 'characters');
}

/**
 * Get current document content
 */
export function getDocument() {
  console.log('[SimpleAgent] Reading document:', documentContent.length, 'characters');
  return documentContent;
}

/**
 * Replace entire document content
 */
export function setDocument(newContent, addToHistory = true) {
  console.log('[SimpleAgent] Setting document to', newContent.length, 'characters');
  
  // Add current state to undo history before changing
  if (addToHistory && documentContent !== newContent) {
    addToUndoHistory(documentContent, 'Document replaced');
  }
  
  documentContent = newContent;
  
  // Notify React component
  if (changeCallback) {
    changeCallback(documentContent);
  }
}

/**
 * Simple AI function with streaming support
 */
export async function askAI(userMessage, onChunk) {
  console.log('[SimpleAgent] User asked:', userMessage);
  
  try {
    // Call AI with streaming
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a LaTeX editing assistant. The user has a LaTeX document.

CURRENT DOCUMENT CONTENT (with line numbers for your reference):
${documentContent.split('\n').map((line, i) => `${String(i + 1).padStart(3, ' ')}: ${line}`).join('\n')}

You can help the user by:
1. Reading and understanding the current document
2. Suggesting modifications using selective edits
3. Providing new LaTeX content to add

IMPORTANT: For document modifications, you have two options:

OPTION 1 - SELECTIVE EDITS (PREFERRED): Use diff-style blocks for targeted changes:

ADD content:
\`\`\`latex-diff
@@ operation:add line:15 @@
\\section{New Section}
This is new content.
\`\`\`

REPLACE content:
\`\`\`latex-diff
@@ operation:replace line:10 delete:2 @@
new content to replace lines 10-11
\`\`\`

DELETE content:
\`\`\`latex-diff
@@ operation:delete line:21 delete:8 @@
\`\`\`

Operations available:
- operation:add line:N - Insert content at line N (pushes existing lines down)
- operation:replace line:N delete:M - Replace M lines starting at line N  
- operation:delete line:N delete:M - Delete M lines starting at line N (NO CONTENT NEEDED for delete)

CRITICAL: Use the EXACT line numbers shown above. Line numbers are 1-based (first line is 1).

OPTION 2 - FULL REPLACEMENT: Only use when making extensive changes:
\`\`\`latex
[complete new document here]
\`\`\`

Always prefer selective edits for small changes. Changes will be applied automatically. Be conversational and explain what you're doing.`
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        model: 'gpt-4',
        temperature: 0.3,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`AI API Error: ${response.status}`);
    }

    let fullResponse = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                if (onChunk) {
                  onChunk(content, fullResponse);
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
    
    console.log('[SimpleAgent] AI responded with', fullResponse.length, 'characters');
    
    // Check for diff-style edits first
    if (hasLatexDiffs(fullResponse)) {
      const diffBlocks = parseLatexDiff(fullResponse);
      const changes = previewLatexDiffs(documentContent, diffBlocks);
      
      console.log('[SimpleAgent] AI provided', diffBlocks.length, 'diff blocks - auto-applying');
      console.log('[SimpleAgent] Diff blocks:', diffBlocks);
      
      // Auto-apply the changes and add to undo history
      const previousContent = documentContent;
      const newContent = applyLatexDiffs(documentContent, diffBlocks);
      addToUndoHistory(previousContent, `Applied ${diffBlocks.length} diff changes`);
      documentContent = newContent;
      
      // Notify React component
      if (changeCallback) {
        changeCallback(documentContent);
      }
      
      return {
        response: fullResponse,
        documentUpdated: true,
        hasDiffs: true,
        diffBlocks: diffBlocks,
        changes: changes,
        autoApplied: true
      };
    }
    
    // Check if AI provided new complete document content
    const latexMatch = fullResponse.match(/```latex\n([\s\S]*?)\n```/);
    if (latexMatch) {
      const newContent = latexMatch[1];
      console.log('[SimpleAgent] AI provided new document content, length:', newContent.length);
      setDocument(newContent);
      
      return {
        response: fullResponse,
        documentUpdated: true,
        newContent: newContent
      };
    }
    
    // Check if AI mentioned operations but didn't provide diff blocks
    const mentionsOperations = /(?:delete|remove|add|replace|insert).*(?:line|section)/i.test(fullResponse);
    if (mentionsOperations && !hasLatexDiffs(fullResponse)) {
      console.warn('[SimpleAgent] AI mentioned operations but provided no diff blocks');
      console.warn('[SimpleAgent] Response:', fullResponse);
    }
    
    return {
      response: fullResponse,
      documentUpdated: false
    };
    
  } catch (error) {
    console.error('[SimpleAgent] Error:', error);
    throw error;
  }
}

/**
 * Apply specific diff blocks to the document
 */
export function applyDiffs(diffBlocks) {
  const newContent = applyLatexDiffs(documentContent, diffBlocks);
  console.log('[SimpleAgent] Applied', diffBlocks.length, 'diff blocks');
  setDocument(newContent);
  return newContent;
}

/**
 * Apply a single diff block
 */
export function applySingleDiff(diffBlock) {
  return applyDiffs([diffBlock]);
}

/**
 * Preview what changes would be made without applying them
 */
export function previewDiffs(diffBlocks) {
  return previewLatexDiffs(documentContent, diffBlocks);
}

/**
 * Add entry to undo history
 */
function addToUndoHistory(content, description) {
  undoHistory.push({
    content: content,
    description: description,
    timestamp: new Date()
  });
  
  // Keep history manageable
  if (undoHistory.length > MAX_UNDO_HISTORY) {
    undoHistory = undoHistory.slice(-MAX_UNDO_HISTORY);
  }
  
  console.log('[SimpleAgent] Added to undo history:', description);
}

/**
 * Undo the last change
 */
export function undoLastChange() {
  if (undoHistory.length === 0) {
    console.log('[SimpleAgent] No changes to undo');
    return false;
  }
  
  const lastEntry = undoHistory.pop();
  console.log('[SimpleAgent] Undoing:', lastEntry.description);
  
  // Set document without adding to history (to avoid infinite undo chain)
  setDocument(lastEntry.content, false);
  return true;
}

/**
 * Get undo history
 */
export function getUndoHistory() {
  return [...undoHistory];
}

/**
 * Check if undo is available
 */
export function canUndo() {
  return undoHistory.length > 0;
}

/**
 * Clear undo history
 */
export function clearUndoHistory() {
  undoHistory = [];
  console.log('[SimpleAgent] Cleared undo history');
}