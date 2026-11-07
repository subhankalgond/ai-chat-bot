import { Message, Attachment } from '@/types';

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return apiKey;
}

export async function* streamGeminiResponse(
  messages: Message[],
  modelId: string = 'gemini-2.0-flash',
  systemPrompt: string = '',
  attachments: Attachment[] = []
): AsyncGenerator<string, void, unknown> {
  const apiKey = getGeminiApiKey();

  // Normalize model ID for Google Gemini REST/SDK
  const cleanModelId = modelId.replace('gemini-', '');
  const targetModel = modelId.startsWith('gemini-') ? modelId : `gemini-${modelId}`;

  // Format messages for Gemini API
  const contents: any[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLatestUserMessage = i === messages.length - 1 && msg.role === 'user';
    const role = msg.role === 'user' ? 'user' : 'model';
    const parts: any[] = [];

    // Attachments
    const msgAttachments = (isLatestUserMessage && attachments.length > 0)
      ? attachments
      : (msg.attachments || []);

    for (const att of msgAttachments) {
      if (att.base64Data && att.type.startsWith('image/')) {
        const base64Content = att.base64Data.split(',')[1] || att.base64Data;
        parts.push({
          inlineData: {
            mimeType: att.type,
            data: base64Content,
          },
        });
      } else if (att.extractedText) {
        parts.push({
          text: `[Attached File: ${att.name}]\n${att.extractedText}\n`,
        });
      }
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    contents.push({ role, parts });
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  };

  if (systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errText}`);
  }

  if (!response.body) {
    throw new Error('Gemini API response body is null');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data:')) {
        const dataJson = trimmed.slice(5).trim();
        if (dataJson === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataJson);
          const candidate = parsed.candidates?.[0];
          const textPart = candidate?.content?.parts?.[0]?.text;
          if (textPart) {
            yield textPart;
          }
        } catch {
          // ignore partial parse errors
        }
      }
    }
  }
}
