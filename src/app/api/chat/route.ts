import { NextRequest, NextResponse } from 'next/server';
import { orchestrateChatStream } from '@/lib/ai/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      modelId = 'gpt-4o',
      systemPrompt = '',
      userInstructions = '',
      attachments = [],
      webSearchEnabled = false,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and must not be empty.' },
        { status: 400 }
      );
    }

    const stream = orchestrateChatStream({
      messages,
      modelId,
      systemPrompt,
      userInstructions,
      attachments,
      webSearchEnabled,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            const payload = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          }
          controller.close();
        } catch (err: any) {
          const errPayload = `data: ${JSON.stringify({
            type: 'error',
            error: err.message || 'Stream generation failed',
          })}\n\n`;
          controller.enqueue(encoder.encode(errPayload));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err: any) {
    console.error('Chat API route error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

