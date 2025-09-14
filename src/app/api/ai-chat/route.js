export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages, model = 'gpt-4', temperature = 0.7, maxTokens = 2048, stream = false } = await request.json();
    
    // Get API key from server-side environment
    const apiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'No OpenAI API key configured on server' 
      }, { status: 500 });
    }
    
    // Make request to OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
        stream: stream
      })
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      return NextResponse.json({ 
        error: `OpenAI API Error: ${openaiResponse.status} - ${errorData.error?.message || 'Unknown error'}` 
      }, { status: openaiResponse.status });
    }
    
    if (stream) {
      // Return streaming response
      return new Response(openaiResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await openaiResponse.json();
      return NextResponse.json(data);
    }
    
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json({ 
      error: `Server error: ${error.message}` 
    }, { status: 500 });
  }
}