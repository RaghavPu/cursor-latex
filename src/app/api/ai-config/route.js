export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get API key from server-side environment variables
    const apiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ 
        hasApiKey: false, 
        error: 'No API key found in environment variables' 
      }, { status: 200 });
    }
    
    // Don't send the actual API key to the client for security
    // Just confirm it exists and provide a masked version
    const maskedKey = apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4);
    
    return NextResponse.json({ 
      hasApiKey: true,
      maskedKey: maskedKey,
      keySource: process.env.OPENAI_KEY ? 'OPENAI_KEY' : 
                 process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY'
    });
    
  } catch (error) {
    return NextResponse.json({ 
      hasApiKey: false, 
      error: error.message 
    }, { status: 500 });
  }
}