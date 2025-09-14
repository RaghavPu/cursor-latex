/**
 * AI Service - Abstraction layer for different AI providers
 * Supports OpenAI, Anthropic Claude, and other providers
 */

class AIService {
  constructor() {
    this.providers = new Map();
    this.currentProvider = null;
    this.apiKey = null;
    this.config = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 10000,
      stream: true
    };
  }

  /**
   * Initialize the AI service with configuration
   */
  async initialize(config = {}) {
    this.config = { ...this.config, ...config };
    
    // Check API key availability via API route
    await this.checkApiKeyAvailability();
    
    // Register available providers
    this.registerProviders();
    
    // Set default provider
    this.setProvider(config.provider || 'openai');
    
    return this.isReady();
  }

  /**
   * Check if API key is available on the server
   */
  async checkApiKeyAvailability() {
    try {
      const response = await fetch('/api/ai-config');
      const data = await response.json();
      
      if (data.hasApiKey) {
        this.apiKey = 'server-side-key'; // Placeholder to indicate key is available
        this.apiKeyAvailable = true;
        console.log(`AI Service initialized with ${data.keySource}: ${data.maskedKey}`);
      } else {
        this.apiKey = null;
        this.apiKeyAvailable = false;
        console.warn('No API key found in environment variables (OPENAI_KEY)');
      }
    } catch (error) {
      console.error('Failed to check API key availability:', error);
      this.apiKey = null;
      this.apiKeyAvailable = false;
    }
  }

  /**
   * Register AI providers
   */
  registerProviders() {
    // OpenAI Provider
    this.providers.set('openai', {
      name: 'OpenAI',
      models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      endpoint: 'https://api.openai.com/v1/chat/completions',
      headers: (apiKey) => ({
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }),
      formatRequest: (messages, config) => ({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: config.stream
      })
    });

    // Anthropic Claude Provider
    this.providers.set('anthropic', {
      name: 'Anthropic',
      models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
      endpoint: 'https://api.anthropic.com/v1/messages',
      headers: (apiKey) => ({
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }),
      formatRequest: (messages, config) => ({
        model: config.model,
        messages: messages.slice(1), // Remove system message for Claude
        system: messages[0]?.role === 'system' ? messages[0].content : undefined,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
        stream: config.stream
      })
    });
  }

  /**
   * Set the current AI provider
   */
  setProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`Provider ${providerName} is not registered`);
    }
    this.currentProvider = providerName;
    return this;
  }


  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this;
  }

  /**
   * Update model
   */
  updateModel(model) {
    this.config.model = model;
    return this;
  }

  /**
   * Check if the service is ready to make requests
   */
  isReady() {
    return !!(this.apiKeyAvailable && this.currentProvider && this.providers.has(this.currentProvider));
  }

  /**
   * Make a chat completion request
   */
  async chatCompletion(messages, options = {}) {
    if (!this.isReady()) {
      throw new Error('AI service not properly initialized');
    }

    const config = { ...this.config, ...options };
    
    try {
      // Use our API route instead of direct OpenAI call
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          stream: config.stream
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`AI API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      // For now, we don't expose streaming to the client; always return full content
      const data = await response.json();
      return this.extractContent(data);
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  }

  /**
   * Handle streaming response
   */
  async *handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const content = this.extractStreamContent(parsed);
              if (content) yield content;
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Extract content from API response
   */
  extractContent(data) {
    if (this.currentProvider === 'openai') {
      return data.choices?.[0]?.message?.content || '';
    } else if (this.currentProvider === 'anthropic') {
      return data.content?.[0]?.text || '';
    }
    return '';
  }

  /**
   * Extract content from streaming response
   */
  extractStreamContent(data) {
    if (this.currentProvider === 'openai') {
      return data.choices?.[0]?.delta?.content || '';
    } else if (this.currentProvider === 'anthropic') {
      return data.delta?.text || '';
    }
    return '';
  }


  /**
   * Get available providers
   */
  getProviders() {
    return Array.from(this.providers.entries()).map(([key, provider]) => ({
      key,
      name: provider.name,
      models: provider.models
    }));
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;