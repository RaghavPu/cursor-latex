'use client';

import { useState, useRef, useEffect } from 'react';
import { askAI } from '../lib/simpleAgent.js';

export default function AIChat({ isDark = false }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentModel, setCurrentModel] = useState('gpt-4');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const streamingMessageRef = useRef('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message to chat
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);

    try {
      setIsLoading(true);
      setError(null);
      
      // Create streaming assistant message
      const assistantMessageId = Date.now() + 1;
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Call AI function with streaming
      const result = await askAI(userMessage, (chunk, fullResponse) => {
        // Update the streaming message
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullResponse }
            : msg
        ));
      });
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: result.response,
              isStreaming: false,
              documentUpdated: result.documentUpdated 
            }
          : msg
      ));
      
    } catch (error) {
      console.error('Chat error:', error);
      setError(error.message);
      
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // State for expanded code blocks
  const [expandedBlocks, setExpandedBlocks] = useState(new Set());

  // Toggle code block expansion
  const toggleBlockExpansion = (blockId) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  // Render message content with Cursor-like code blocks
  const renderMessageContent = (content, isStreaming = false, messageId) => {
    if (!content) return null;

    // Find all code block patterns, including incomplete ones during streaming
    const parts = [];
    let lastIndex = 0;
    let blockIndex = 0;

    // Look for complete code blocks
    const completeBlockRegex = /```(\w*)\n([\s\S]*?)\n```/g;
    let match;

    while ((match = completeBlockRegex.exec(content)) !== null) {
      // Add text before the code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
          index: parts.length
        });
      }

      // Add the complete code block
      parts.push({
        type: 'codeblock',
        language: match[1] || 'text',
        code: match[2],
        complete: true,
        blockId: `${messageId}-${blockIndex}`,
        index: parts.length
      });

      lastIndex = match.index + match[0].length;
      blockIndex++;
    }

    // Check for incomplete code block at the end (during streaming)
    const remainingContent = content.slice(lastIndex);
    const incompleteMatch = remainingContent.match(/```(\w*)\n?([\s\S]*)$/);
    
    if (incompleteMatch && isStreaming) {
      // Add text before the incomplete code block
      const textBeforeBlock = remainingContent.slice(0, incompleteMatch.index);
      if (textBeforeBlock) {
        parts.push({
          type: 'text',
          content: textBeforeBlock,
          index: parts.length
        });
      }

      // Add the incomplete code block
      parts.push({
        type: 'codeblock',
        language: incompleteMatch[1] || 'text',
        code: incompleteMatch[2],
        complete: false,
        streaming: true,
        blockId: `${messageId}-${blockIndex}`,
        index: parts.length
      });
    } else if (remainingContent) {
      // Add remaining text
      parts.push({
        type: 'text',
        content: remainingContent,
        index: parts.length
      });
    }

    return parts.map((part) => {
      if (part.type === 'codeblock') {
        const isExpanded = expandedBlocks.has(part.blockId);
        const shouldCollapse = part.code.split('\n').length > 10;
        
        return (
          <div key={part.index} className="my-4">
            {/* Cursor-style code block header */}
            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-t-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                  {part.language}
                </div>
                {part.language === 'latex' && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Document Update
                  </div>
                )}
                {part.streaming && (
                  <div className="flex space-x-0.5">
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {shouldCollapse && (
                  <button
                    onClick={() => toggleBlockExpansion(part.blockId)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                )}
                <button
                  onClick={() => navigator.clipboard.writeText(part.code)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                  disabled={!part.code.trim()}
                >
                  Copy
                </button>
              </div>
            </div>
            
            {/* Code content */}
            <div className="bg-gray-50 dark:bg-gray-900 border-x border-b border-gray-200 dark:border-gray-700 rounded-b-lg">
              <div 
                className={`relative overflow-hidden transition-all duration-300 ${
                  shouldCollapse && !isExpanded ? 'max-h-32' : 'max-h-none'
                }`}
              >
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-gray-800 dark:text-gray-200 font-mono">
                    {part.code}
                    {part.streaming && (
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
                    )}
                  </code>
                </pre>
                
                {/* Fade overlay when collapsed */}
                {shouldCollapse && !isExpanded && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 dark:from-gray-900 to-transparent pointer-events-none"></div>
                )}
              </div>
              
              {/* Click to expand hint */}
              {shouldCollapse && !isExpanded && (
                <div className="px-4 pb-2">
                  <button
                    onClick={() => toggleBlockExpansion(part.blockId)}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium"
                  >
                    Click to expand ({part.code.split('\n').length} lines)
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      } else {
        // Regular text content
        return (
          <div key={part.index} className="whitespace-pre-wrap">
            {part.content}
            {isStreaming && part.index === parts.length - 1 && (
              <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse"></span>
            )}
          </div>
        );
      }
    });
  };

  const clearChat = () => {
    setMessages([]);
  };


  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-gray-600 dark:bg-gray-500 rounded-md flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">AI Assistant</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ask questions or request changes</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Model Selection */}
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400"
              title="Select AI Model"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
            
            <button
              onClick={clearChat}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Clear chat"
              disabled={messages.length === 0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              LaTeX AI Assistant
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-48">
              Ask questions about LaTeX syntax, get help with equations, or request code explanations
            </p>
            {/* No readiness warning; server route handles key presence */}
          </div>
        ) : (
          <div className="px-4 py-3 space-y-4">
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'user' ? (
                  <div className="w-full bg-gray-100 dark:bg-gray-800/60 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">{message.content}</div>
                  </div>
                ) : (
                  <div className="w-full">
                    {message.isStreaming && (
                      <div className="flex items-center space-x-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span>generating...</span>
                      </div>
                    )}
                    <div className={`text-sm leading-relaxed ${
                      message.isError
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {message.isError ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        renderMessageContent(message.content, message.isStreaming, message.id)
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {error && (
              <div className="w-full text-sm text-red-600 dark:text-red-400 leading-relaxed">
                {error}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 dark:border-gray-800">
        {isLoading && (
          <div className="mb-3 flex items-center text-sm text-gray-600 dark:text-gray-400">
            <div className="flex space-x-1 mr-2">
              <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>AI is thinking...</span>
          </div>
        )}
        
        <div className={`relative rounded-lg border transition-all duration-200 ${
          isInputFocused 
            ? 'border-gray-400 dark:border-gray-500 shadow-sm' 
            : 'border-gray-200 dark:border-gray-700'
        }`}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={"Ask me anything about LaTeX..."}
            disabled={isLoading}
            className="w-full px-4 py-3 pr-12 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 disabled:cursor-not-allowed"
            rows="1"
            style={{ 
              minHeight: '48px',
              maxHeight: '120px',
              lineHeight: '1.5'
            }}
          />
          
          <div className="absolute right-2 bottom-2 flex items-center space-x-1">
            {inputValue.trim() && (
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="p-2 bg-gray-700 hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md transition-colors shadow-sm"
                title="Send message"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Server Connected</span>
          </span>
        </div>
      </div>
    </div>
  );
}