/**
 * useAI Hook - React hook for AI service integration
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import latexAssistant from '../lib/ai/latexAssistant.js';
import rateLimiter from '../lib/ai/rateLimiter.js';

export function useAI() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [config, setConfig] = useState(null);
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  
  const abortControllerRef = useRef(null);

  /**
   * Initialize AI service
   */
  const initialize = useCallback(async (aiConfig = {}) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await latexAssistant.initialize(aiConfig);
      setIsInitialized(true);
      setConfig(latexAssistant.getConfig());
      
    } catch (err) {
      setError(err.message);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check rate limits before making request
   */
  const checkRateLimit = useCallback((userId = 'anonymous') => {
    const result = rateLimiter.isAllowed(userId);
    setRateLimitInfo(result);
    return result;
  }, []);

  /**
   * Ask a question to the AI assistant
   */
  const askQuestion = useCallback(async (question, context = {}, userId = 'anonymous') => {
    // Check rate limits
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Record request
      rateLimiter.recordRequest(userId);
      
      const response = await latexAssistant.askQuestion(question, context);
      return response;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkRateLimit]);

  /**
   * Ask question with streaming response
   */
  const askQuestionStream = useCallback(async function* (question, context = {}, userId = 'anonymous') {
    // Check rate limits
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      // Record request
      rateLimiter.recordRequest(userId);
      
      const stream = latexAssistant.askQuestionStream(question, context);
      
      for await (const chunk of stream) {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }
        yield chunk;
      }
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [checkRateLimit]);

  /**
   * Analyze LaTeX code
   */
  const analyzeCode = useCallback(async (latexCode, errorMessage = null, userId = 'anonymous') => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      rateLimiter.recordRequest(userId);
      const response = await latexAssistant.analyzeCode(latexCode, errorMessage);
      return response;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkRateLimit]);

  /**
   * Get suggestions for cursor position
   */
  const getSuggestions = useCallback(async (latexCode, cursorPosition, context = {}, userId = 'anonymous') => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      rateLimiter.recordRequest(userId);
      const response = await latexAssistant.getSuggestions(latexCode, cursorPosition, context);
      return response;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkRateLimit]);

  /**
   * Convert natural language to LaTeX
   */
  const naturalLanguageToLatex = useCallback(async (description, documentType = 'article', userId = 'anonymous') => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      rateLimiter.recordRequest(userId);
      const response = await latexAssistant.naturalLanguageToLatex(description, documentType);
      return response;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkRateLimit]);

  /**
   * Explain LaTeX code
   */
  const explainCode = useCallback(async (latexCode, specific = null, userId = 'anonymous') => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      rateLimiter.recordRequest(userId);
      const response = await latexAssistant.explainCode(latexCode, specific);
      return response;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkRateLimit]);

  /**
   * Get help with mathematical expressions
   */
  const helpWithMath = useCallback(async (mathDescription, displayStyle = 'inline', userId = 'anonymous') => {
    const rateCheck = checkRateLimit(userId);
    if (!rateCheck.allowed) {
      throw new Error(rateCheck.reason);
    }

    try {
      setIsLoading(true);
      setError(null);
      
      rateLimiter.recordRequest(userId);
      const response = await latexAssistant.helpWithMath(mathDescription, displayStyle);
      return response;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [checkRateLimit]);

  /**
   * Cancel current AI request
   */
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  /**
   * Update AI configuration
   */
  const updateConfig = useCallback((newConfig) => {
    latexAssistant.updateConfig(newConfig);
    setConfig(latexAssistant.getConfig());
  }, []);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    latexAssistant.clearHistory();
  }, []);

  /**
   * Get conversation history
   */
  const getHistory = useCallback(() => {
    return latexAssistant.getHistory();
  }, []);

  /**
   * Get rate limit statistics
   */
  const getRateLimitStats = useCallback((userId = 'anonymous') => {
    return rateLimiter.getUserStats(userId);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isLoading,
    error,
    config,
    rateLimitInfo,
    
    // Actions
    initialize,
    askQuestion,
    askQuestionStream,
    analyzeCode,
    getSuggestions,
    naturalLanguageToLatex,
    explainCode,
    helpWithMath,
    cancelRequest,
    updateConfig,
    clearHistory,
    getHistory,
    getRateLimitStats,
    checkRateLimit,
    
    // Utilities
    isReady: isInitialized && latexAssistant.isReady()
  };
}