import Anthropic from '@anthropic-ai/sdk';
import { Message, Attachment } from '@/types';

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured on the server.');
  }
  return new Anthropic({ apiKey });
}

function resolveClaudeModel(modelId: string): string {
  if (modelId.includes('sonnet')) return 'claude-3-5-sonnet-20241022';
  if (modelId.includes('haiku')) return 'claude-3-5-haiku-20241022';
  if (modelId.includes('opus')) return 'claude-3-opus-20240229';
  return 'claude-3-5-sonnet-20241022';
}

export async function* streamClaudeResponse(
  messages: Message[],
  modelId: string = 'claude-3-5-sonnet',
  systemPrompt: string = '',
  attachments: Attachment[] = []
): AsyncGenerator<string, void, unknown> {
  const anthropic = getAnthropicClient();
  const targetModel = resolveClaudeModel(modelId);

  const formattedMessages: Anthropic.MessageParam[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isLatestUserMessage = i === messages.length - 1 && msg.role === 'user';
    const role: 'user' | 'assistant' = msg.role === 'user' ? 'user' : 'assistant';

    if (role === 'user') {
      const contentParts: any[] = [];

      const msgAttachments = (isLatestUserMessage && attachments.length > 0)
        ? attachments
        : (msg.attachments || []);

      for (const att of msgAttachments) {
        if (att.base64Data && att.type.startsWith('image/')) {
          const mime = att.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
          const base64Content = att.base64Data.split(',')[1] || att.base64Data;
          contentParts.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mime,
              data: base64Content,
            },
          });
        } else if (att.extractedText) {
          contentParts.push({
            type: 'text',
            text: `\n[Attached File: ${att.name}]\n${att.extractedText}\n`,
          });
        }
      }

      if (msg.content) {
        contentParts.push({ type: 'text', text: msg.content });
      }

      formattedMessages.push({
        role: 'user',
        content: contentParts.length === 1 && contentParts[0].type === 'text'
          ? contentParts[0].text
          : contentParts,
      });
    } else {
      formattedMessages.push({
        role: 'assistant',
        content: msg.content,
      });
    }
  }

  const stream = await anthropic.messages.stream({
    model: targetModel,
    max_tokens: 8192,
    system: systemPrompt || 'You are NOVA AI, a brilliant, thoughtful, and articulate AI assistant.',
    messages: formattedMessages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      yield chunk.delta.text;
    }
  }
}

