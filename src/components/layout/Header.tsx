'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { ModelSelector } from './ModelSelector';
import {
  Menu,
  Radio,
  Globe,
  Sparkles,
  Download,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenAdmin: () => void;
}

export function Header({ onToggleSidebar, onOpenAdmin }: HeaderProps) {
  const {
    currentConversation,
    setVoiceModeOpen,
    webSearchEnabled,
    messages,
  } = useChat();

  const handleExportChat = () => {
    if (messages.length === 0) return;
    const chatExport = {
      title: currentConversation?.title || 'NOVA AI Conversation',
      exportedAt: new Date().toISOString(),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.createdAt,
        modelId: m.modelId,
      })),
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(chatExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nova-chat-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <header className="h-14 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 flex items-center justify-between sticky top-0 z-30">
      {/* Left Area: Toggle Sidebar & Model Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground md:hidden"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <ModelSelector />

        {/* Current Conversation Title (Truncated) */}
        {currentConversation && (
          <span className="hidden lg:inline text-xs text-muted-foreground font-medium truncate max-w-[240px]">
            / {currentConversation.title}
          </span>
        )}
      </div>

      {/* Right Area: Web Search status, Export & Start Live Voice */}
      <div className="flex items-center gap-2.5">
        {webSearchEnabled && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px] font-medium">
            <Globe className="w-3 h-3 animate-pulse" />
            <span>Search Active</span>
          </div>
        )}

        {messages.length > 0 && (
          <button
            onClick={handleExportChat}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Export conversation as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        {/* Start Live Voice Mode Button */}
        <button
          onClick={() => setVoiceModeOpen(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-all shadow-sm group"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400 group-hover:animate-pulse" />
          <span>Live Voice</span>
        </button>
      </div>
    </header>
  );
}
