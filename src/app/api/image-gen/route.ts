import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = '1024x1024', style = 'vivid' } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const openaiKey = process.env.OPENAI_API_KEY;

    // 1. If OpenAI API key is configured, use DALL-E 3
    if (openaiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt.trim(),
          n: 1,
          size: size === '1024x1792' ? '1024x1792' : '1024x1024',
          quality: 'standard',
          style: style === 'natural' ? 'natural' : 'vivid',
        });

        const imageUrl = response?.data?.[0]?.url;
        const revisedPrompt = response?.data?.[0]?.revised_prompt;

        if (imageUrl) {
          return NextResponse.json({
            success: true,
            imageUrl,
            revisedPrompt,
            provider: 'dall-e-3',
          });
        }
      } catch (err: any) {
        console.warn('DALL-E 3 error, falling back to Flux:', err.message);
      }
    }

    // 2. High-quality Flux / Pollinations AI image generation fallback (live, free, instant)
    const encodedPrompt = encodeURIComponent(prompt.trim());
    const fluxUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux`;

    return NextResponse.json({
      success: true,
      imageUrl: fluxUrl,
      revisedPrompt: prompt,
      provider: 'flux-ai',
    });
  } catch (err: any) {
    console.error('Image generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Image generation failed' },
      { status: 500 }
    );
  }
}
