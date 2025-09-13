export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { content } = await request.json();
    if (typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Empty LaTeX content' }, { status: 400 });
    }

    // Use texlive.net with correct multipart/form-data format
    const formData = new FormData();
    formData.append('filename[]', 'document.tex');
    formData.append('filecontents[]', content);
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');

    const upstream = await fetch('https://texlive.net/cgi-bin/latexcgi', {
      method: 'POST',
      body: formData,
    });

    const contentType = upstream.headers.get('content-type') || '';

    if (!upstream.ok) {
      const logText = await upstream.text();
      return NextResponse.json({ error: logText || `Compile failed (status ${upstream.status})` }, { status: 502 });
    }

    if (contentType.includes('application/pdf')) {
      const pdfBuffer = Buffer.from(await upstream.arrayBuffer());
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'no-store',
        },
      });
    } else {
      // If not PDF, it's probably an error log
      const logText = await upstream.text();
      return NextResponse.json({ error: logText }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({ error: String(error?.message || error) }, { status: 500 });
  }
}