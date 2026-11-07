import OpenAI from 'openai';
import { Message, Attachment } from '@/types';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured on the server.');
  }
  return new OpenAI({ apiKey });
}

export async function* streamOpenAIResponse(
  messages: Message[],
  modelId: string = 'gpt-4o',
  systemPrompt: string = '',
  attachments: Attachment[] = []
): AsyncGenerator<string, void, unknown> {
  const openai = getOpenAIClient();

  const formattedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    formattedMessages.push({
      role: 'system',
      content: systemPrompt,
    });
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLatestUserMessage = i === messages.length - 1 && msg.role === 'user';

    if (msg.role === 'user') {
      const contentParts: OpenAI.Chat.ChatCompletionContentPart[] = [
        { type: 'text', text: msg.content },
      ];

      // Attachments for the message
      const msgAttachments = (isLatestUserMessage && attachments.length > 0)
        ? attachments
        : (msg.attachments || []);

      for (const att of msgAttachments) {
        if (att.base64Data && att.type.startsWith('image/')) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: att.base64Data,
              detail: 'auto',
            },
          });
        } else if (att.extractedText) {
          contentParts.push({
            type: 'text',
            text: `\n[Attached File: ${att.name}]\n${att.extractedText}\n`,
          });
        }
      }

      formattedMessages.push({
        role: 'user',
        content: contentParts.length === 1 ? msg.content : contentParts,
      });
    } else if (msg.role === 'assistant') {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content,
      });
    }
  }

  const stream = await openai.chat.completions.create({
    model: modelId,
    messages: formattedMessages,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Mint an ephemeral session token for OpenAI Realtime Voice WebRTC
 */
export async function createOpenAIRealtimeSession(voice: string = 'alloy') {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured for Realtime Voice.');
  }

  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-realtime-preview-2024-12-17',
      voice: voice,
      modalities: ['audio', 'text'],
      instructions:
        'You are NOVA AI, a concise, natural, and helpful voice assistant. Speak with conversational cadence and clarity.',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create OpenAI Realtime session: ${errorText}`);
  }

  return await response.json();
}
