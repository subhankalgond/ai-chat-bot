import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { text, voice = 'alloy', speed = 1.0 } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      const openai = new OpenAI({ apiKey: openAiKey });
      const mp3Response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: (voice as any) || 'alloy',
        input: text.slice(0, 4000), // Max limit safe guard
        speed: speed || 1.0,
      });

      const buffer = Buffer.from(await mp3Response.arrayBuffer());

      return new Response(buffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Return flag indicating client should use Web Speech API synthesis
    return NextResponse.json(
      { useClientSpeechSynthesis: true, message: 'Server TTS fallback to browser synthesis' },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Speech synthesis error:', err);
    return NextResponse.json(
      { error: err.message || 'Speech generation failed' },
      { status: 500 }
    );
  }
}

