/**
 * Simple AI Agent - First Principles Approach
 * Just stores document content and lets AI read/write it
 */

// Global document store
let documentContent = '';
let changeCallback = null;

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
export function setDocument(newContent) {
  console.log('[SimpleAgent] Setting document to', newContent.length, 'characters');
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

CURRENT DOCUMENT CONTENT:
${documentContent}

You can help the user by:
1. Reading and understanding the current document
2. Suggesting modifications
3. Providing new LaTeX content to add

When the user asks you to modify the document, provide the COMPLETE new document content in a code block like this:

\`\`\`latex
[complete new document here]
\`\`\`

Always include the entire document, not just the changes. Be conversational and explain what you're doing.`
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
    
    // Check if AI provided new document content
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
    
    return {
      response: fullResponse,
      documentUpdated: false
    };
    
  } catch (error) {
    console.error('[SimpleAgent] Error:', error);
    throw error;
  }
}