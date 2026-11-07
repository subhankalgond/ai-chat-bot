import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey) {
      const openai = new OpenAI({ apiKey: openAiKey });
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });

      return NextResponse.json({
        text: transcription.text,
      });
    }

    return NextResponse.json(
      { error: 'OpenAI Whisper key not configured. Use browser speech recognition fallback.' },
      { status: 501 }
    );
  } catch (err: any) {
    console.error('Transcription error:', err);
    return NextResponse.json(
      { error: err.message || 'Transcription failed' },
      { status: 500 }
    );
  }
}

