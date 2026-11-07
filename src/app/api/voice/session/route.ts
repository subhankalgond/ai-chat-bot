import { NextRequest, NextResponse } from 'next/server';
import { createOpenAIRealtimeSession } from '@/lib/ai/providers/openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = 'openai', voice = 'alloy', modelId = 'gpt-4o' } = body;

    if (provider === 'openai') {
      try {
        const session = await createOpenAIRealtimeSession(voice);
        return NextResponse.json({
          provider: 'openai',
          clientSecret: session.client_secret?.value,
          sessionId: session.id,
          model: session.model,
          voice: session.voice,
        });
      } catch (err: any) {
        // If Realtime API key isn't active or enabled, provide fallback mode
        return NextResponse.json({
          provider: 'openai',
          usePipelineFallback: true,
          message: err.message,
        });
      }
    }

    if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'GEMINI_API_KEY is not configured on the server.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        voice: voice || 'Puck',
        endpoint: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent',
        configured: true,
        usePipelineFallback: true, // Seamless audio streaming pipeline
      });
    }

    if (provider === 'claude') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'ANTHROPIC_API_KEY is not configured on the server.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        provider: 'claude',
        model: modelId || 'claude-3-5-sonnet',
        voice: voice || 'nova-natural',
        usePipelineFallback: true, // Claude streaming speech pipeline
        configured: true,
      });
    }

    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  } catch (err: any) {
    console.error('Voice session error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize voice session' },
      { status: 500 }
    );
  }
}
