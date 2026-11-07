'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getModelById } from '@/lib/models/registry';
import {
  X,
  User,
  ShieldCheck,
  MessageSquare,
  Cpu,
  Download,
  Database,
  Radio,
  CheckCircle,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { conversations, selectedModelId } = useChat();
  const activeModel = getModelById(selectedModelId);

  const handleExportData = () => {
    const rawConvs = localStorage.getItem('nova_conversations_v1') || '[]';
    const rawMsgs = localStorage.getItem('nova_messages_v1') || '{}';
    const exportData = {
      user: 'Subhan Kalgond',
      exportedAt: new Date().toISOString(),
      conversations: JSON.parse(rawConvs),
      messages: JSON.parse(rawMsgs),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-ai-archive-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">NOVA User Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 space-y-5 text-xs">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-foreground text-background font-bold text-xl flex items-center justify-center shadow-md">
              SK
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-foreground">Subhan Kalgond</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Platform Owner
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5">subhankalgond1@gmail.com</p>
            </div>
          </div>

          {/* Quick Telemetry Cards */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div className="p-3 rounded-xl border border-border bg-secondary/40 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Conversations</span>
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold font-mono text-foreground">
                {conversations.length}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-secondary/40 space-y-1">
              <div className="text-muted-foreground flex items-center justify-between">
                <span>Active Model</span>
                <Cpu className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-sm font-bold font-mono text-foreground truncate">
                {activeModel.name}
              </div>
            </div>
          </div>

          {/* Environment & Security Info */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border bg-secondary/20">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" /> Database Engine
              </span>
              <span className="font-semibold text-foreground font-mono">
                {isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local Storage Cache'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-amber-400" /> Realtime Voice
              </span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Operational
              </span>
            </div>
          </div>

          {/* Export Data */}
          <button
            onClick={handleExportData}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-foreground font-medium transition-colors"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>Export Complete History Archive (JSON)</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end bg-secondary/20">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-foreground text-background font-medium text-xs hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

