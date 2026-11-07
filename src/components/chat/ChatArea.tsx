'use client';

import React, { useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { MessageItem } from './MessageItem';
import { WelcomeScreen } from './WelcomeScreen';
import { Composer } from './Composer';

export function ChatArea() {
  const { messages, isStreaming, editMessage, regenerateMessage } = useChat();
  const scrollEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content or streaming
  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Scrollable Message History or Welcome Screen */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <WelcomeScreen />
        ) : (
          <div className="divide-y divide-border/20 pb-6">
            {messages.map((msg, index) => {
              const isLastAssistantMessage =
                msg.role === 'assistant' && index === messages.length - 1;

              return (
                <MessageItem
                  key={msg.id}
                  message={msg}
                  isStreaming={isLastAssistantMessage && isStreaming}
                  onEdit={(newContent) => editMessage(msg.id, newContent)}
                  onRegenerate={
                    isLastAssistantMessage && !isStreaming
                      ? () => regenerateMessage()
                      : undefined
                  }
                />
              );
            })}
            <div ref={scrollEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Persistent ChatGPT-Style Composer */}
      <div className="flex-shrink-0 border-t border-border/40 bg-background/80 backdrop-blur-md pt-2">
        <Composer />
      </div>
    </div>
  );
}

