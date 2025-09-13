'use client';

import { useState, useRef, useEffect } from 'react';
import { useAI } from '../hooks/useAI.js';

export default function AIChat({ isDark = false, onShowConfig }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);
  const streamingMessageRef = useRef('');
  
  const { 
    isReady, 
    isLoading, 
    error, 
    askQuestionStream, 
    cancelRequest,
    getRateLimitStats 
  } = useAI();

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
    if (!inputValue.trim() || isLoading || isStreaming) return;
    if (!isReady) {
      if (onShowConfig) {
        onShowConfig();
      }
      return;
    }

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
    setIsStreaming(true);
    streamingMessageRef.current = '';

    // Add empty assistant message that will be filled by streaming
    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const stream = askQuestionStream(userMessage);
      
      for await (const chunk of stream) {
        streamingMessageRef.current += chunk;
        
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: streamingMessageRef.current }
            : msg
        ));
      }
      
      // Mark streaming as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Update the assistant message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { 
              ...msg, 
              content: `Sorry, I encountered an error: ${error.message}`,
              isError: true,
              isStreaming: false 
            }
          : msg
      ));
    } finally {
      setIsStreaming(false);
      streamingMessageRef.current = '';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCancelStream = () => {
    cancelRequest();
    setIsStreaming(false);
    
    // Remove the streaming message
    setMessages(prev => prev.filter(msg => !msg.isStreaming));
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
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                AI Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isReady ? 'Ready to help with LaTeX' : 'Setup required'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {!isReady && (
              <button
                onClick={() => onShowConfig && onShowConfig()}
                className="p-1.5 text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                title="Configure AI"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
            
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
            {!isReady && (
              <button
                onClick={() => onShowConfig && onShowConfig()}
                className="mt-4 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700"
              >
                Configure AI to get started
              </button>
            )}
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
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
                      message.isError
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {message.content}
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
        {isStreaming && (
          <div className="mb-3 flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-current rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <span>AI is responding...</span>
            </div>
            <button
              onClick={handleCancelStream}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
        
        <div className={`relative rounded-lg border transition-all duration-200 ${
          isInputFocused 
            ? 'border-gray-400 dark:border-gray-500 shadow-sm' 
            : 'border-gray-200 dark:border-gray-700'
        } ${!isReady ? 'opacity-50' : ''}`}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={isReady ? "Ask me anything about LaTeX..." : "Configure AI to start chatting"}
            disabled={!isReady || isLoading || isStreaming}
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
                disabled={!isReady || isLoading || isStreaming}
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
          {isReady && (
            <span className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span>AI Ready</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}