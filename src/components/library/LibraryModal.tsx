'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import {
  X,
  Bookmark,
  Search,
  Code,
  FileSpreadsheet,
  BookOpen,
  Shield,
  Send,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';

interface PromptTemplate {
  id: string;
  category: 'Engineering' | 'Analysis' | 'Writing' | 'Reasoning';
  title: string;
  description: string;
  prompt: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'p-1',
    category: 'Engineering',
    title: 'Senior Code Review & Optimization',
    description: 'Thorough inspection for race conditions, time complexity, and security.',
    prompt: 'Review the following code like a principal engineer. Highlight potential concurrency bugs, algorithmic time complexity bottlenecks, memory leaks, and suggest modern idiomatic improvements with examples:\n\n```typescript\n// Paste code here\n```',
  },
  {
    id: 'p-2',
    category: 'Analysis',
    title: 'Spreadsheet & Financial Trend Analysis',
    description: 'Extract statistical metrics, growth rates, and key variances.',
    prompt: 'Analyze the attached spreadsheet data. Provide:\n1. Executive Summary\n2. Key Trends & Anomalies\n3. Growth Rate and Variance Metrics\n4. Strategic Recommendations based on the data.',
  },
  {
    id: 'p-3',
    category: 'Reasoning',
    title: 'First-Principles Architecture Breakdown',
    description: 'Deconstruct complex systems to core axioms with trade-off matrices.',
    prompt: 'Deconstruct this problem using first-principles reasoning. Identify the fundamental constraints, evaluate 3 distinct technical architectures, and compare them in a markdown table covering latency, scalability, and complexity.',
  },
  {
    id: 'p-4',
    category: 'Writing',
    title: 'Executive Technical Brief',
    description: 'Distill dense engineering topics into concise stakeholder briefs.',
    prompt: 'Draft an executive briefing document on this technical topic for C-level leadership. Structure it with Problem Statement, Business Impact, Architectural Solution, Estimated ROI, and Implementation Roadmap.',
  },
  {
    id: 'p-5',
    category: 'Engineering',
    title: 'REST & GraphQL API Contract Design',
    description: 'Design robust, idempotent APIs with error schemas and validation.',
    prompt: 'Design a production-ready API schema for this domain. Include idempotent HTTP methods, status codes, Zod validation schemas, and structured error payloads.',
  },
];

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LibraryModal({ isOpen, onClose }: LibraryModalProps) {
  const { sendMessage } = useChat();
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = PROMPT_TEMPLATES.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleUsePrompt = (prompt: string) => {
    sendMessage(prompt);
    onClose();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
              <Bookmark className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">NOVA Prompt & Template Library</h3>
              <p className="text-[11px] text-muted-foreground">
                Battle-tested architectural and reasoning prompts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border bg-background/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search prompts by keyword, category, or task…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/60 border border-border text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-6 space-y-3 overflow-y-auto flex-1 text-xs">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border bg-secondary/30 hover:bg-secondary/60 transition-colors space-y-2 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground font-mono">
                    {item.category}
                  </span>
                  <span className="font-semibold text-sm text-foreground">{item.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(item.id, item.prompt)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs"
                    title="Copy prompt"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleUsePrompt(item.prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">{item.description}</p>
              <div className="p-2.5 rounded-lg bg-background/60 border border-border/60 text-[11px] text-muted-foreground/90 font-mono whitespace-pre-wrap line-clamp-2">
                {item.prompt}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex justify-end bg-secondary/20">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium border border-border"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
}
