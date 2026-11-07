'use client';

import React, { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { MODEL_REGISTRY, AVAILABLE_VOICES } from '@/lib/models/registry';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import {
  X,
  Settings,
  Sliders,
  Database,
  Trash2,
  Check,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { selectedModelId, setSelectedModelId, theme, toggleTheme } = useChat();

  const [customInstructions, setCustomInstructions] = useState('');
  const [preferredVoice, setPreferredVoice] = useState('alloy');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nova_user_instructions');
    if (saved) setCustomInstructions(saved);
  }, []);

  const handleSave = () => {
    localStorage.setItem('nova_user_instructions', customInstructions);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClearAllData = () => {
    if (confirm('Are you sure you want to delete all saved conversations and local history? This cannot be undone.')) {
      localStorage.removeItem('nova_conversations_v1');
      localStorage.removeItem('nova_messages_v1');
      window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">NOVA Platform Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Custom Instructions */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground flex items-center gap-1.5">
              <span>Personal Instructions & System Directive</span>
            </label>
            <p className="text-muted-foreground">
              What would you like NOVA AI to know about you to provide better responses?
            </p>
            <textarea
              rows={4}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. I am a software engineer. Explain concepts with concise TypeScript code. Avoid unnecessary conversational fluff."
              className="w-full p-3 rounded-xl border border-border bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-y"
            />
          </div>

          {/* Default Model */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Default Model</label>
            <select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-border bg-secondary/60 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {MODEL_REGISTRY.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.providerLabel}) — {m.description.slice(0, 48)}…
                </option>
              ))}
            </select>
          </div>

          {/* Database & Cloud Sync Status */}
          <div className="p-3.5 rounded-xl border border-border bg-secondary/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" /> PostgreSQL & Supabase Auth
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}
              >
                {isSupabaseConfigured ? 'Connected & Active' : 'Local Storage Mode'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isSupabaseConfigured
                ? 'Your account, messages, and voice sessions sync automatically to your PostgreSQL cloud instance.'
                : 'Conversations persist locally in your browser storage. To enable multi-device sync, add Supabase credentials to .env.'}
            </p>
          </div>

          {/* Danger Zone: Clear History */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <div className="font-semibold text-foreground">Clear Local Conversation Cache</div>
              <div className="text-muted-foreground text-[11px]">Delete all stored chats and transcripts</div>
            </div>
            <button
              onClick={handleClearAllData}
              className="px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border flex items-center justify-end gap-2 bg-secondary/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background font-medium text-xs hover:opacity-90 shadow-sm"
          >
            {savedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            <span>{savedSuccess ? 'Saved' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

