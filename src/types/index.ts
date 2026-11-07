export type AIProvider = 'openai' | 'gemini' | 'claude';

export type ModelModality = 'text' | 'vision' | 'audio' | 'tools' | 'reasoning';

export interface ModelDefinition {
  id: string;
  name: string;
  provider: AIProvider;
  providerLabel: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  modalities: ModelModality[];
  supportsRealtimeVoice: boolean;
  supportsStreaming: boolean;
  supportsWebSearch: boolean;
  isPopular?: boolean;
  costPer1kInputUSD: number;
  costPer1kOutputUSD: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  extractedText?: string;
  base64Data?: string;
  previewUrl?: string;
}

export interface SearchCitation {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  modelId?: string;
  attachments?: Attachment[];
  citations?: SearchCitation[];
  reasoningContent?: string;
  isVoice?: boolean;
  status?: 'sending' | 'streaming' | 'complete' | 'error';
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Conversation {
  id: string;
  userId?: string;
  title: string;
  modelId: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
}

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'interrupted'
  | 'reconnecting'
  | 'error';

export interface VoiceSettings {
  provider: AIProvider;
  voice: string;
  speed: number;
  autoSendSilenceMs: number;
  micMuted: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  customInstructions?: string;
  preferredModel?: string;
  preferredVoice?: string;
  theme?: 'light' | 'dark' | 'system';
  role?: 'user' | 'admin';
}

export interface ProviderStatus {
  provider: AIProvider;
  name: string;
  isConfigured: boolean;
  modelCount: number;
  status: 'operational' | 'degraded' | 'missing_key';
  errorMessage?: string;
}

export interface SystemStats {
  totalRequests: number;
  totalTokens: number;
  estimatedCostUSD: number;
  activeVoiceSessions: number;
  recentErrors: number;
  providers: ProviderStatus[];
}
