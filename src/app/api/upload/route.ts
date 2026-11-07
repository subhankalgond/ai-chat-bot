import { NextRequest, NextResponse } from 'next/server';
import { parseFileBuffer } from '@/lib/files/parser';
import { generateUUID } from '@/lib/utils';
import { Attachment } from '@/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 25MB' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parsed = await parseFileBuffer(buffer, file.name, file.type);

    const attachment: Attachment = {
      id: generateUUID(),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      extractedText: parsed.extractedText,
      base64Data: parsed.base64Data,
      previewUrl: parsed.isImage ? parsed.base64Data : undefined,
    };

    return NextResponse.json({
      success: true,
      attachment,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json(
      { error: err.message || 'File processing failed' },
      { status: 500 }
    );
  }
}

