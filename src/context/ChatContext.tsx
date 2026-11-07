'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Conversation, Message, Attachment, AIProvider, SearchCitation } from '@/types';
import { MODEL_REGISTRY, DEFAULT_MODEL_ID, getModelById } from '@/lib/models/registry';
import { generateUUID } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface ChatContextType {
  conversations: Conversation[];
  currentConversationId: string | null;
  currentConversation: Conversation | null;
  messages: Message[];
  selectedModelId: string;
  setSelectedModelId: (modelId: string) => void;
  isStreaming: boolean;
  webSearchEnabled: boolean;
  setWebSearchEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  createNewConversation: (initialTitle?: string, modelId?: string) => Conversation;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  togglePinConversation: (id: string) => void;
  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  regenerateMessage: (messageId?: string) => Promise<void>;
  stopGeneration: () => void;
  voiceModeOpen: boolean;
  setVoiceModeOpen: (open: boolean) => void;
  imageGenOpen: boolean;
  setImageGenOpen: (open: boolean) => void;
  addVoiceTurn: (userTranscript: string, assistantResponse: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_STORAGE_CONVERSATIONS_KEY = 'nova_conversations_v1';
const LOCAL_STORAGE_MESSAGES_KEY = 'nova_messages_v1';
const LOCAL_STORAGE_THEME_KEY = 'nova_theme_v1';

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>({});
  const [selectedModelId, setSelectedModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(false);
  const [voiceModeOpen, setVoiceModeOpen] = useState<boolean>(false);
  const [imageGenOpen, setImageGenOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as 'light' | 'dark' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }

      const savedConvs = localStorage.getItem(LOCAL_STORAGE_CONVERSATIONS_KEY);
      const savedMsgs = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);

      if (savedConvs) {
        const parsedConvs: Conversation[] = JSON.parse(savedConvs);
        setConversations(parsedConvs);
        if (parsedConvs.length > 0) {
          setCurrentConversationId(parsedConvs[0].id);
          setSelectedModelId(parsedConvs[0].modelId || DEFAULT_MODEL_ID);
        }
      }

      if (savedMsgs) {
        setAllMessages(JSON.parse(savedMsgs));
      }
    } catch (e) {
      console.warn('Failed to load from storage:', e);
    }
  }, []);

  // Save conversations to localStorage
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_CONVERSATIONS_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  // Save messages to localStorage
  useEffect(() => {
    if (Object.keys(allMessages).length > 0) {
      localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(allMessages));
    }
  }, [allMessages]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  const currentConversation = conversations.find((c) => c.id === currentConversationId) || null;
  const currentMessages = currentConversationId ? allMessages[currentConversationId] || [] : [];

  const createNewConversation = useCallback(
    (initialTitle = 'New Conversation', modelId = selectedModelId) => {
      const newConv: Conversation = {
        id: generateUUID(),
        title: initialTitle,
        modelId: modelId,
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setConversations((prev) => [newConv, ...prev]);
      setCurrentConversationId(newConv.id);
      setSelectedModelId(newConv.modelId);
      setAllMessages((prev) => ({ ...prev, [newConv.id]: [] }));

      // Supabase persistence if connected
      if (isSupabaseConfigured && supabase) {
        supabase.from('conversations').insert({
          id: newConv.id,
          title: newConv.title,
          model_id: newConv.modelId,
          is_pinned: false,
        }).then();
      }

      return newConv;
    },
    [selectedModelId]
  );

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv?.modelId) {
      setSelectedModelId(conv.modelId);
    }
  }, [conversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setAllMessages((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });

    if (currentConversationId === id) {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        setCurrentConversationId(remaining.length > 0 ? remaining[0].id : null);
        return remaining;
      });
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('conversations').delete().eq('id', id).then();
    }
  }, [currentConversationId]);

  const renameConversation = useCallback((id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: new Date().toISOString() } : c))
    );
    if (isSupabaseConfigured && supabase) {
      supabase.from('conversations').update({ title: newTitle }).eq('id', id).then();
    }
  }, []);

  const togglePinConversation = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
    if (isSupabaseConfigured && supabase) {
      const target = conversations.find((c) => c.id === id);
      if (target) {
        supabase.from('conversations').update({ is_pinned: !target.isPinned }).eq('id', id).then();
      }
    }
  }, [conversations]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const executeStream = async (
    conversationId: string,
    historyMessages: Message[],
    modelId: string,
    activeAttachments: Attachment[] = []
  ) => {
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const assistantMsgId = generateUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      conversationId,
      role: 'assistant',
      content: '',
      modelId,
      status: 'streaming',
      createdAt: new Date().toISOString(),
    };

    setAllMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), assistantMsg],
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyMessages,
          modelId,
          attachments: activeAttachments,
          webSearchEnabled,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }

      if (!res.body) {
        throw new Error('Response body is null');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let citations: SearchCitation[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            try {
              const event = JSON.parse(trimmed.slice(5).trim());
              if (event.type === 'token') {
                accumulatedContent += event.content;
                setAllMessages((prev) => {
                  const msgs = prev[conversationId] || [];
                  return {
                    ...prev,
                    [conversationId]: msgs.map((m) =>
                      m.id === assistantMsgId ? { ...m, content: accumulatedContent } : m
                    ),
                  };
                });
              } else if (event.type === 'citations') {
                citations = event.citations || [];
                setAllMessages((prev) => {
                  const msgs = prev[conversationId] || [];
                  return {
                    ...prev,
                    [conversationId]: msgs.map((m) =>
                      m.id === assistantMsgId ? { ...m, citations } : m
                    ),
                  };
                });
              } else if (event.type === 'error') {
                throw new Error(event.error);
              }
            } catch (err: any) {
              if (err.message && err.message !== 'Unexpected end of JSON input') {
                console.warn('Chunk parse error:', err);
              }
            }
          }
        }
      }

      // Mark complete
      setAllMessages((prev) => {
        const msgs = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: msgs.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: accumulatedContent,
                  citations,
                  status: 'complete',
                }
              : m
          ),
        };
      });

      // Update conversation timestamp
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, updatedAt: new Date().toISOString(), lastMessageSnippet: accumulatedContent.slice(0, 80) }
            : c
        )
      );

      // Auto-generate title if it's the first message
      if (historyMessages.length === 1 && historyMessages[0].role === 'user') {
        const firstUserText = historyMessages[0].content;
        const autoTitle = firstUserText.length > 32 ? firstUserText.slice(0, 32) + '…' : firstUserText;
        renameConversation(conversationId, autoTitle);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setAllMessages((prev) => {
          const msgs = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: msgs.map((m) =>
              m.id === assistantMsgId ? { ...m, status: 'complete' } : m
            ),
          };
        });
      } else {
        setAllMessages((prev) => {
          const msgs = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: msgs.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content: m.content || `⚠️ Error: ${err.message}`,
                    status: 'error',
                    error: err.message,
                  }
                : m
            ),
          };
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const sendMessage = async (content: string, attachments: Attachment[] = []) => {
    let targetConvId = currentConversationId;
    if (!targetConvId) {
      const newConv = createNewConversation();
      targetConvId = newConv.id;
    }

    const userMsg: Message = {
      id: generateUUID(),
      conversationId: targetConvId,
      role: 'user',
      content,
      attachments,
      modelId: selectedModelId,
      status: 'complete',
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...(allMessages[targetConvId] || []), userMsg];
    setAllMessages((prev) => ({
      ...prev,
      [targetConvId!]: updatedMessages,
    }));

    await executeStream(targetConvId, updatedMessages, selectedModelId, attachments);
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!currentConversationId) return;
    const msgs = allMessages[currentConversationId] || [];
    const index = msgs.findIndex((m) => m.id === messageId);
    if (index === -1) return;

    // Truncate history at this user message with the new content
    const truncatedHistory = msgs.slice(0, index);
    const updatedUserMsg: Message = {
      ...msgs[index],
      content: newContent,
      createdAt: new Date().toISOString(),
    };

    const newHistory = [...truncatedHistory, updatedUserMsg];
    setAllMessages((prev) => ({
      ...prev,
      [currentConversationId]: newHistory,
    }));

    await executeStream(currentConversationId, newHistory, selectedModelId, updatedUserMsg.attachments || []);
  };

  const regenerateMessage = async (messageId?: string) => {
    if (!currentConversationId) return;
    const msgs = allMessages[currentConversationId] || [];
    if (msgs.length === 0) return;

    let history: Message[] = [];
    if (messageId) {
      const index = msgs.findIndex((m) => m.id === messageId);
      if (index > 0) {
        history = msgs.slice(0, index);
      }
    } else {
      // Regenerate last assistant response
      if (msgs[msgs.length - 1].role === 'assistant') {
        history = msgs.slice(0, -1);
      } else {
        history = msgs;
      }
    }

    setAllMessages((prev) => ({
      ...prev,
      [currentConversationId]: history,
    }));

    const lastUserMessage = [...history].reverse().find((m) => m.role === 'user');
    await executeStream(
      currentConversationId,
      history,
      selectedModelId,
      lastUserMessage?.attachments || []
    );
  };

  // Seamless Voice Turn context sharing
  const addVoiceTurn = (userTranscript: string, assistantResponse: string) => {
    let convId = currentConversationId;
    if (!convId) {
      const newConv = createNewConversation('Live Voice Session');
      convId = newConv.id;
    }

    const userMsg: Message = {
      id: generateUUID(),
      conversationId: convId,
      role: 'user',
      content: userTranscript,
      isVoice: true,
      status: 'complete',
      createdAt: new Date().toISOString(),
    };

    const assistantMsg: Message = {
      id: generateUUID(),
      conversationId: convId,
      role: 'assistant',
      content: assistantResponse,
      modelId: selectedModelId,
      isVoice: true,
      status: 'complete',
      createdAt: new Date().toISOString(),
    };

    setAllMessages((prev) => ({
      ...prev,
      [convId!]: [...(prev[convId!] || []), userMsg, assistantMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? { ...c, updatedAt: new Date().toISOString(), lastMessageSnippet: assistantResponse.slice(0, 80) }
          : c
      )
    );
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        currentConversation,
        messages: currentMessages,
        selectedModelId,
        setSelectedModelId,
        isStreaming,
        webSearchEnabled,
        setWebSearchEnabled,
        createNewConversation,
        selectConversation,
        deleteConversation,
        renameConversation,
        togglePinConversation,
        sendMessage,
        editMessage,
        regenerateMessage,
        stopGeneration,
        voiceModeOpen,
        setVoiceModeOpen,
        imageGenOpen,
        setImageGenOpen,
        addVoiceTurn,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

