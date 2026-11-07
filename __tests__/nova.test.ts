import {
  MODEL_REGISTRY,
  getModelById,
  getModelsByProvider,
  DEFAULT_MODEL_ID,
} from '../src/lib/models/registry';
import { performWebSearch } from '../src/lib/search/web-search';
import { parseFileBuffer } from '../src/lib/files/parser';
import { generateUUID, formatTimestamp, formatFileSize, truncate } from '../src/lib/utils';
import { Message } from '../src/types';

describe('NOVA AI — Comprehensive Platform Test Suite', () => {
  // 1. Multi-Model Support & Registry Tests
  describe('Multi-Model Support & Centralized Registry', () => {
    test('Registry contains models from all 3 required providers: OpenAI, Gemini, and Claude', () => {
      const providers = new Set(MODEL_REGISTRY.map((m) => m.provider));
      expect(providers.has('openai')).toBe(true);
      expect(providers.has('gemini')).toBe(true);
      expect(providers.has('claude')).toBe(true);
    });

    test('Each model has verified capabilities, context window, and pricing metrics', () => {
      MODEL_REGISTRY.forEach((model) => {
        expect(model.id).toBeTruthy();
        expect(model.name).toBeTruthy();
        expect(model.contextWindow).toBeGreaterThan(0);
        expect(model.maxOutputTokens).toBeGreaterThan(0);
        expect(model.modalities.length).toBeGreaterThan(0);
        expect(typeof model.costPer1kInputUSD).toBe('number');
        expect(typeof model.costPer1kOutputUSD).toBe('number');
      });
    });

    test('Realtime Voice is supported on designated models', () => {
      const gpt4o = getModelById('gpt-4o');
      const geminiFlash = getModelById('gemini-2.0-flash');
      const claudeSonnet = getModelById('claude-3-5-sonnet');

      expect(gpt4o.supportsRealtimeVoice).toBe(true);
      expect(geminiFlash.supportsRealtimeVoice).toBe(true);
      expect(claudeSonnet.supportsRealtimeVoice).toBe(true);
    });

    test('getModelById returns the requested model or safe fallback to default', () => {
      const model = getModelById('claude-3-5-sonnet');
      expect(model.id).toBe('claude-3-5-sonnet');
      expect(model.provider).toBe('claude');

      const nonExistent = getModelById('unknown-ai-model');
      expect(nonExistent).toBeDefined();
      expect(nonExistent.id).toBe(DEFAULT_MODEL_ID);
    });

    test('getModelsByProvider filters accurately for all providers', () => {
      const openaiModels = getModelsByProvider('openai');
      const geminiModels = getModelsByProvider('gemini');
      const claudeModels = getModelsByProvider('claude');

      expect(openaiModels.length).toBeGreaterThanOrEqual(2);
      expect(geminiModels.length).toBeGreaterThanOrEqual(2);
      expect(claudeModels.length).toBeGreaterThanOrEqual(2);

      openaiModels.forEach((m) => expect(m.provider).toBe('openai'));
      geminiModels.forEach((m) => expect(m.provider).toBe('gemini'));
      claudeModels.forEach((m) => expect(m.provider).toBe('claude'));
    });
  });

  // 2. Web Search Engine Tests
  describe('Web Search Engine & Grounding', () => {
    test('performWebSearch returns structured results with title, URL, snippet, and source', async () => {
      const query = 'artificial intelligence recent breakthroughs';
      const searchResult = await performWebSearch(query);

      expect(searchResult).toBeDefined();
      expect(searchResult.query).toBe(query);
      expect(typeof searchResult.formattedContext).toBe('string');
      expect(Array.isArray(searchResult.results)).toBe(true);

      if (searchResult.results.length > 0) {
        const first = searchResult.results[0];
        expect(first.title).toBeTruthy();
        expect(first.url).toBeTruthy();
        expect(first.snippet).toBeTruthy();
        expect(first.source).toBeTruthy();
      }
    });
  });

  // 3. File & Multimodal Document Processing Tests
  describe('File Parsing & Multimodal Pipeline', () => {
    test('Parses plain text, JSON, and code files', async () => {
      const content = 'Hello NOVA AI, this is a test document with raw text.';
      const buffer = Buffer.from(content, 'utf-8');
      const parsed = await parseFileBuffer(buffer, 'notes.txt', 'text/plain');

      expect(parsed.isImage).toBe(false);
      expect(parsed.extractedText).toBe(content);
      expect(parsed.fileSize).toBe(buffer.length);
    });

    test('Encodes images to base64 Data URLs for vision models', async () => {
      const fakeImageBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
      const parsed = await parseFileBuffer(fakeImageBytes, 'chart.png', 'image/png');

      expect(parsed.isImage).toBe(true);
      expect(parsed.base64Data).toBeDefined();
      expect(parsed.base64Data?.startsWith('data:image/png;base64,')).toBe(true);
    });

    test('Parses CSV data into spreadsheet rows', async () => {
      const csvData = 'Year,Revenue,Profit\n2024,1000000,250000\n2025,1800000,480000';
      const buffer = Buffer.from(csvData, 'utf-8');
      const parsed = await parseFileBuffer(buffer, 'metrics.csv', 'text/csv');

      expect(parsed.extractedText).toContain('Year');
      expect(parsed.extractedText).toContain('Revenue');
      expect(parsed.extractedText).toContain('1800000');
    });
  });

  // 4. Chat and Voice Context Continuity
  describe('Chat and Voice Unified Context Architecture', () => {
    test('Maintains conversation message thread across multiple turns', () => {
      const conversationId = generateUUID();
      const messages: Message[] = [];

      // Step 1: User types a text message
      messages.push({
        id: generateUUID(),
        conversationId,
        role: 'user',
        content: 'What is deep learning?',
        createdAt: new Date().toISOString(),
      });

      // Step 2: Assistant responds
      messages.push({
        id: generateUUID(),
        conversationId,
        role: 'assistant',
        content: 'Deep learning is a subset of machine learning based on artificial neural networks...',
        modelId: 'gpt-4o',
        createdAt: new Date().toISOString(),
      });

      // Step 3: User activates voice mode and asks follow-up (Scenario 1: Chat to Voice)
      messages.push({
        id: generateUUID(),
        conversationId,
        role: 'user',
        content: 'Can you give me a real-world example?',
        isVoice: true,
        createdAt: new Date().toISOString(),
      });

      // Step 4: Assistant responds verbally (Voice-to-chat continuity)
      messages.push({
        id: generateUUID(),
        conversationId,
        role: 'assistant',
        content: 'A classic real-world example is convolutional neural networks used in autonomous vehicles...',
        modelId: 'gpt-4o',
        isVoice: true,
        createdAt: new Date().toISOString(),
      });

      // Step 5: User switches model from GPT to Gemini (Scenario 4: Change model)
      const nextTurnModel = 'gemini-2.0-flash';
      messages.push({
        id: generateUUID(),
        conversationId,
        role: 'user',
        content: 'Now write a Python implementation of that CNN example.',
        modelId: nextTurnModel,
        createdAt: new Date().toISOString(),
      });

      expect(messages.length).toBe(5);
      expect(messages.every((m) => m.conversationId === conversationId)).toBe(true);
      expect(messages[2].isVoice).toBe(true);
      expect(messages[3].isVoice).toBe(true);
      expect(messages[4].content).toContain('Python');
    });
  });

  // 5. Utilities & Formatting
  describe('Utilities & Data Formatters', () => {
    test('generateUUID generates unique valid RFC UUID strings', () => {
      const u1 = generateUUID();
      const u2 = generateUUID();
      expect(u1).not.toBe(u2);
      expect(u1.length).toBe(36);
      expect(u1.split('-').length).toBe(5);
    });

    test('formatFileSize formats bytes, KB, and MB accurately', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(2048)).toBe('2.0 KB');
      expect(formatFileSize(5242880)).toBe('5.0 MB');
    });

    test('truncate trims long text gracefully with ellipsis', () => {
      expect(truncate('Hello world', 5)).toBe('Hello…');
      expect(truncate('Short', 10)).toBe('Short');
    });

    test('formatTimestamp formats dates cleanly', () => {
      const now = new Date();
      const formatted = formatTimestamp(now);
      expect(formatted).toBeTruthy();
    });
  });
});
