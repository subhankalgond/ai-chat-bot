import { Message, Attachment, SearchCitation } from '@/types';
import { getModelById } from '@/lib/models/registry';
import { streamOpenAIResponse } from './providers/openai';
import { streamGeminiResponse } from './providers/gemini';
import { streamClaudeResponse } from './providers/claude';
import { performWebSearch } from '@/lib/search/web-search';

export interface OrchestrationOptions {
  messages: Message[];
  modelId: string;
  systemPrompt?: string;
  userInstructions?: string;
  attachments?: Attachment[];
  webSearchEnabled?: boolean;
}

export interface StreamEvent {
  type: 'token' | 'citations' | 'done' | 'error';
  content?: string;
  citations?: SearchCitation[];
  error?: string;
}

export async function* orchestrateChatStream(
  options: OrchestrationOptions
): AsyncGenerator<StreamEvent, void, unknown> {
  const {
    messages,
    modelId,
    systemPrompt = '',
    userInstructions = '',
    attachments = [],
    webSearchEnabled = false,
  } = options;

  const modelDef = getModelById(modelId);

  // 1. Prepare base system prompt
  let finalSystemPrompt = `You are NOVA AI, a premier multi-model conversational AI platform combining deep intelligence, precision, and natural conversational flair.
Provide beautifully formatted responses using Markdown, LaTeX ($...$ and $$...$$ for math), tables, and syntax-highlighted code blocks where appropriate.
Remain articulate, balanced, and context-aware.`;

  if (userInstructions) {
    finalSystemPrompt += `\n\nUser's Personal Instructions/Preferences:\n${userInstructions}`;
  }

  if (systemPrompt) {
    finalSystemPrompt += `\n\nAdditional Context:\n${systemPrompt}`;
  }

  // 2. Perform Web Search if enabled
  let citations: SearchCitation[] = [];
  const latestUserMessage = messages[messages.length - 1];

  if (webSearchEnabled && latestUserMessage && latestUserMessage.role === 'user') {
    try {
      const searchResult = await performWebSearch(latestUserMessage.content);
      if (searchResult.results.length > 0) {
        citations = searchResult.results;
        finalSystemPrompt += `\n\n[Real-time Web Search Results for current query]:\n${searchResult.formattedContext}\nInstructions: Base your response on these authentic sources. Cite them using markdown links or numbers [1], [2], etc. corresponding to the sources.`;
        // Emit citations event first so UI can show the source cards immediately
        yield {
          type: 'citations',
          citations,
        };
      }
    } catch (err: any) {
      console.warn('Web search failed, proceeding without search context:', err);
    }
  }

  // 3. Sliding context window management
  // Ensure we don't blow context limit: take up to last 20 messages while preserving system intent
  const contextMessages = messages.length > 24
    ? [...messages.slice(0, 2), ...messages.slice(-20)]
    : messages;

  // 4. Stream from provider
  try {
    let tokenGenerator: AsyncGenerator<string, void, unknown>;

    switch (modelDef.provider) {
      case 'openai':
        tokenGenerator = streamOpenAIResponse(
          contextMessages,
          modelDef.id,
          finalSystemPrompt,
          attachments
        );
        break;

      case 'gemini':
        tokenGenerator = streamGeminiResponse(
          contextMessages,
          modelDef.id,
          finalSystemPrompt,
          attachments
        );
        break;

      case 'claude':
        tokenGenerator = streamClaudeResponse(
          contextMessages,
          modelDef.id,
          finalSystemPrompt,
          attachments
        );
        break;

      default:
        throw new Error(`Unsupported AI provider: ${modelDef.provider}`);
    }

    for await (const token of tokenGenerator) {
      yield {
        type: 'token',
        content: token,
      };
    }

    yield {
      type: 'done',
    };
  } catch (err: any) {
    console.error(`Orchestration error with ${modelDef.name}:`, err);
    yield {
      type: 'error',
      error: err.message || `An error occurred while generating a response with ${modelDef.name}.`,
    };
  }
}
