'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import { MODEL_REGISTRY, getModelById } from '@/lib/models/registry';
import { AIProvider, ModelDefinition } from '@/types';
import { ChevronDown, Check, Sparkles, Cpu, Radio, Zap } from 'lucide-react';

export function ModelSelector() {
  const { selectedModelId, setSelectedModelId, isStreaming } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = getModelById(selectedModelId);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const providers: { provider: AIProvider; label: string }[] = [
    { provider: 'openai', label: 'OpenAI GPT' },
    { provider: 'gemini', label: 'Google Gemini' },
    { provider: 'claude', label: 'Anthropic Claude' },
  ];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={isStreaming}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-secondary/60 hover:bg-secondary text-foreground text-xs font-medium transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400" />
        <span className="font-semibold">{activeModel.name}</span>
        <span className="text-[11px] text-muted-foreground font-mono">
          {activeModel.providerLabel}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl p-2 z-50 animate-in fade-in-50 zoom-in-95 max-h-[480px] overflow-y-auto">
          <div className="px-3 py-2 border-b border-border/60 text-xs font-semibold text-muted-foreground">
            Select AI Provider & Model
          </div>

          {providers.map(({ provider, label }) => {
            const providerModels = MODEL_REGISTRY.filter((m) => m.provider === provider);

            return (
              <div key={provider} className="py-2">
                <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {label}
                </div>

                <div className="space-y-1 mt-1">
                  {providerModels.map((m) => {
                    const isSelected = m.id === selectedModelId;

                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModelId(m.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors text-xs ${
                          isSelected
                            ? 'bg-secondary font-medium'
                            : 'hover:bg-muted/50 text-foreground'
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          {isSelected ? (
                            <Check className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Cpu className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-foreground">{m.name}</span>
                            {m.isPopular && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                Popular
                              </span>
                            )}
                            {m.supportsRealtimeVoice && (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                                <Radio className="w-2.5 h-2.5" /> Voice
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {m.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
