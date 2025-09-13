/**
 * LaTeX Assistant - Specialized AI service for LaTeX document assistance
 */

import aiService from './aiService.js';

class LaTeXAssistant {
  constructor() {
    this.systemPrompt = `You are a LaTeX expert assistant helping users write and edit LaTeX documents. You have deep knowledge of:

- LaTeX syntax, commands, and packages
- Mathematical typesetting with amsmath, amsfonts, amssymb
- Document structure and formatting
- Common LaTeX errors and solutions
- Best practices for academic writing
- Bibliography management with BibTeX
- Figure and table creation
- Cross-referencing and citations

When helping users:
1. Provide clear, concise explanations
2. Give working LaTeX code examples
3. Explain the reasoning behind suggestions
4. Offer multiple solutions when appropriate
5. Help debug compilation errors
6. Suggest improvements for better formatting

Always format LaTeX code in code blocks and explain any packages that need to be included.`;

    this.conversationHistory = [];
  }

  /**
   * Initialize the LaTeX assistant
   */
  async initialize(config = {}) {
    await aiService.initialize({
      model: 'gpt-4',
      temperature: 0.3, // Lower temperature for more consistent LaTeX help
      maxTokens: 2048,
      ...config
    });
    return this;
  }

  /**
   * Ask a general LaTeX question
   */
  async askQuestion(question, context = {}) {
    const messages = this.buildMessages(question, context);
    
    try {
      const response = await aiService.chatCompletion(messages, { stream: false });
      this.addToHistory('user', question);
      this.addToHistory('assistant', response);
      return response;
    } catch (error) {
      console.error('LaTeX Assistant Error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  /**
   * Get streaming response for real-time assistance
   */
  async *askQuestionStream(question, context = {}) {
    const messages = this.buildMessages(question, context);
    
    try {
      const stream = await aiService.chatCompletion(messages, { stream: true });
      let fullResponse = '';
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        yield chunk;
      }
      
      this.addToHistory('user', question);
      this.addToHistory('assistant', fullResponse);
    } catch (error) {
      console.error('LaTeX Assistant Stream Error:', error);
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  /**
   * Analyze LaTeX code for errors and improvements
   */
  async analyzeCode(latexCode, errorMessage = null) {
    let question = `Please analyze this LaTeX code for errors, improvements, and best practices:\n\n\`\`\`latex\n${latexCode}\n\`\`\``;
    
    if (errorMessage) {
      question += `\n\nThe compilation produced this error:\n${errorMessage}`;
    }

    return this.askQuestion(question, { type: 'code_analysis', code: latexCode });
  }

  /**
   * Get suggestions for LaTeX code at cursor position
   */
  async getSuggestions(latexCode, cursorPosition, context = {}) {
    const beforeCursor = latexCode.slice(0, cursorPosition);
    const afterCursor = latexCode.slice(cursorPosition);
    
    const question = `I'm writing LaTeX and my cursor is at this position (marked with |CURSOR|):

\`\`\`latex
${beforeCursor}|CURSOR|${afterCursor}
\`\`\`

Please suggest what I might want to write next, considering the context. Provide specific LaTeX commands or completions that would be helpful.`;

    return this.askQuestion(question, { 
      type: 'suggestions', 
      cursorPosition,
      beforeCursor,
      afterCursor 
    });
  }

  /**
   * Convert natural language to LaTeX
   */
  async naturalLanguageToLatex(description, documentType = 'article') {
    const question = `Convert this natural language description to LaTeX code for a ${documentType} document:

"${description}"

Please provide complete, compilable LaTeX code with appropriate packages and formatting.`;

    return this.askQuestion(question, { 
      type: 'natural_to_latex', 
      description, 
      documentType 
    });
  }

  /**
   * Explain LaTeX code
   */
  async explainCode(latexCode, specific = null) {
    let question = `Please explain this LaTeX code in detail:\n\n\`\`\`latex\n${latexCode}\n\`\`\``;
    
    if (specific) {
      question += `\n\nSpecifically, I'd like to understand: ${specific}`;
    }

    return this.askQuestion(question, { type: 'explanation', code: latexCode });
  }

  /**
   * Get help with mathematical expressions
   */
  async helpWithMath(mathDescription, displayStyle = 'inline') {
    const question = `Help me write LaTeX code for this mathematical expression: "${mathDescription}"

Please provide both inline math ($...$) and display math (\\[...\\] or equation environment) versions if applicable. The preferred style is: ${displayStyle}`;

    return this.askQuestion(question, { 
      type: 'math_help', 
      description: mathDescription, 
      displayStyle 
    });
  }

  /**
   * Get document structure suggestions
   */
  async suggestStructure(topic, documentType = 'article', length = 'medium') {
    const question = `I want to write a ${documentType} about "${topic}" (${length} length). Please suggest a good document structure with sections, subsections, and brief descriptions of what each part should contain. Provide the LaTeX outline with \\section{} and \\subsection{} commands.`;

    return this.askQuestion(question, { 
      type: 'structure', 
      topic, 
      documentType, 
      length 
    });
  }

  /**
   * Build messages array for AI request
   */
  buildMessages(question, context = {}) {
    const messages = [
      { role: 'system', content: this.systemPrompt }
    ];

    // Add relevant conversation history (last 3 exchanges to keep context manageable)
    const recentHistory = this.conversationHistory.slice(-6);
    messages.push(...recentHistory);

    // Add current question
    messages.push({ role: 'user', content: question });

    return messages;
  }

  /**
   * Add message to conversation history
   */
  addToHistory(role, content) {
    this.conversationHistory.push({ role, content });
    
    // Keep history manageable (last 20 messages)
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-20);
    }
  }

  /**
   * Clear conversation history
   */
  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Get conversation history
   */
  getHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Check if assistant is ready
   */
  isReady() {
    return aiService.isReady();
  }

  /**
   * Get current AI configuration
   */
  getConfig() {
    return aiService.getConfig();
  }

  /**
   * Update AI configuration
   */
  updateConfig(config) {
    return aiService.updateConfig(config);
  }
}

// Create singleton instance
const latexAssistant = new LaTeXAssistant();

export default latexAssistant;