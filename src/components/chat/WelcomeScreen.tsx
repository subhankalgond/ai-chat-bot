'use client';

import React from 'react';
import { useChat } from '@/context/ChatContext';
import { getModelById } from '@/lib/models/registry';
import {
  Sparkles,
  Code,
  FileSpreadsheet,
  Cpu,
  Compass,
  Radio,
  FileText,
} from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: FileSpreadsheet,
    title: 'Analyze Data & Spreadsheets',
    prompt: 'How can I analyze financial CSV and spreadsheet data with key trend insights?',
  },
  {
    icon: Code,
    title: 'Code Architecture & Debugging',
    prompt: 'Explain how to design low-latency streaming WebRTC architectures with TypeScript.',
  },
  {
    icon: Cpu,
    title: 'Multi-Model Synthesis',
    prompt: 'Compare the reasoning strengths of GPT-4o, Gemini 2.0 Flash, and Claude 3.5 Sonnet.',
  },
  {
    icon: Radio,
    title: 'Interactive Live Voice',
    prompt: 'Let\'s talk! Start a conversational real-time voice session about human-AI collaboration.',
  },
];

export function WelcomeScreen() {
  const { sendMessage, selectedModelId, setVoiceModeOpen } = useChat();
  const activeModel = getModelById(selectedModelId);

  const handleSelectSuggestion = (s: typeof SUGGESTIONS[0]) => {
    if (s.title === 'Interactive Live Voice') {
      setVoiceModeOpen(true);
    } else {
      sendMessage(s.prompt);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in">
      {/* Geometric Emblem */}
      <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl tracking-tighter mb-4 shadow-md">
        N
      </div>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
        What can I help you accomplish today?
      </h1>

      <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
        Currently orchestrating with <span className="font-semibold text-foreground">{activeModel.name}</span> by {activeModel.providerLabel}. Switch providers anytime without losing context.
      </p>

      {/* Suggestion Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-8">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSelectSuggestion(item)}
              className="flex items-start gap-3 p-3.5 rounded-2xl border border-border/80 bg-secondary/30 hover:bg-secondary hover:border-border text-left transition-all group"
            >
              <div className="w-7 h-7 rounded-lg bg-secondary text-foreground flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <div className="text-xs font-semibold text-foreground">{item.title}</div>
                <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                  {item.prompt}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
