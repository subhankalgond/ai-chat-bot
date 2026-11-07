import { ModelDefinition, AIProvider } from '@/types';

export const MODEL_REGISTRY: ModelDefinition[] = [
  // --- OpenAI Models ---
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Flagship omni-model. Superior vision, complex reasoning, and live voice compatibility.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'vision', 'audio', 'tools'],
    supportsRealtimeVoice: true,
    supportsStreaming: true,
    supportsWebSearch: true,
    isPopular: true,
    costPer1kInputUSD: 0.0025,
    costPer1kOutputUSD: 0.0100,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'High-speed, cost-efficient multimodal model for quick tasks and daily queries.',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    modalities: ['text', 'vision', 'tools'],
    supportsRealtimeVoice: false,
    supportsStreaming: true,
    supportsWebSearch: true,
    costPer1kInputUSD: 0.00015,
    costPer1kOutputUSD: 0.0006,
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    providerLabel: 'OpenAI',
    description: 'Specialized reasoning model with step-by-step thinking for STEM, math, and code.',
    contextWindow: 200000,
    maxOutputTokens: 65536,
    modalities: ['text', 'reasoning', 'tools'],
    supportsRealtimeVoice: false,
    supportsStreaming: true,
    supportsWebSearch: true,
    costPer1kInputUSD: 0.0011,
    costPer1kOutputUSD: 0.0044,
  },

  // --- Google Gemini Models ---
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    providerLabel: 'Google',
    description: 'Next-generation Gemini with low-latency multimodal capabilities and live audio streaming.',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    modalities: ['text', 'vision', 'audio', 'tools'],
    supportsRealtimeVoice: true,
    supportsStreaming: true,
    supportsWebSearch: true,
    isPopular: true,
    costPer1kInputUSD: 0.0001,
    costPer1kOutputUSD: 0.0004,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    providerLabel: 'Google',
    description: 'Massive 2M token context window. Ideal for large document analysis, codebases, and deep research.',
    contextWindow: 2097152,
    maxOutputTokens: 8192,
    modalities: ['text', 'vision', 'audio', 'tools', 'reasoning'],
    supportsRealtimeVoice: false,
    supportsStreaming: true,
    supportsWebSearch: true,
    costPer1kInputUSD: 0.00125,
    costPer1kOutputUSD: 0.0050,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    providerLabel: 'Google',
    description: 'Blazing fast, lightweight powerhouse for rapid Q&A and instant summarization.',
    contextWindow: 1048576,
    maxOutputTokens: 8192,
    modalities: ['text', 'vision', 'tools'],
    supportsRealtimeVoice: false,
    supportsStreaming: true,
    supportsWebSearch: true,
    costPer1kInputUSD: 0.000075,
    costPer1kOutputUSD: 0.0003,
  },

  // --- Anthropic Claude Models ---
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'claude',
    providerLabel: 'Anthropic',
    description: 'Exceptional reasoning, sophisticated prose, elite coding, and subtle nuance understanding.',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    modalities: ['text', 'vision', 'tools', 'reasoning'],
    supportsRealtimeVoice: true, // Powered by NOVA real-time speech pipeline
    supportsStreaming: true,
    supportsWebSearch: true,
    isPopular: true,
    costPer1kInputUSD: 0.0030,
    costPer1kOutputUSD: 0.0150,
  },
  {
    id: 'claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'claude',
    providerLabel: 'Anthropic',
    description: 'High-speed Claude model optimized for quick conversational turns and responsiveness.',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    modalities: ['text', 'vision', 'tools'],
    supportsRealtimeVoice: true,
    supportsStreaming: true,
    supportsWebSearch: true,
    costPer1kInputUSD: 0.0008,
    costPer1kOutputUSD: 0.0040,
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'claude',
    providerLabel: 'Anthropic',
    description: 'Deep synthesis, extensive technical writing, and profound conceptual analysis.',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    modalities: ['text', 'vision', 'tools'],
    supportsRealtimeVoice: false,
    supportsStreaming: true,
    supportsWebSearch: true,
    costPer1kInputUSD: 0.0150,
    costPer1kOutputUSD: 0.0750,
  },
];

export const DEFAULT_MODEL_ID = 'gpt-4o';

export function getModelById(modelId: string): ModelDefinition {
  const model = MODEL_REGISTRY.find((m) => m.id === modelId);
  return model || MODEL_REGISTRY[0];
}

export function getModelsByProvider(provider: AIProvider): ModelDefinition[] {
  return MODEL_REGISTRY.filter((m) => m.provider === provider);
}

export const AVAILABLE_VOICES = {
  openai: [
    { id: 'alloy', name: 'Alloy', gender: 'Neutral', accent: 'American' },
    { id: 'echo', name: 'Echo', gender: 'Male', accent: 'American' },
    { id: 'fable', name: 'Fable', gender: 'British', accent: 'British' },
    { id: 'onyx', name: 'Onyx', gender: 'Deep Male', accent: 'American' },
    { id: 'nova', name: 'Nova', gender: 'Female', accent: 'American' },
    { id: 'shimmer', name: 'Shimmer', gender: 'Expressive Female', accent: 'American' },
  ],
  gemini: [
    { id: 'Puck', name: 'Puck', gender: 'Playful Male', accent: 'Neutral' },
    { id: 'Charon', name: 'Charon', gender: 'Deep Resonant', accent: 'Neutral' },
    { id: 'Kore', name: 'Kore', gender: 'Warm Female', accent: 'Neutral' },
    { id: 'Fenrir', name: 'Fenrir', gender: 'Direct Male', accent: 'Neutral' },
    { id: 'Aoede', name: 'Aoede', gender: 'Melodic Female', accent: 'Neutral' },
  ],
  claude: [
    { id: 'nova-natural', name: 'Nova Natural', gender: 'Refined Female', accent: 'Neutral' },
    { id: 'orion-calm', name: 'Orion Calm', gender: 'Calm Male', accent: 'Neutral' },
    { id: 'celeste-warm', name: 'Celeste Warm', gender: 'Warm Female', accent: 'Neutral' },
  ],
};

