'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import { generateUUID } from '@/lib/utils';
import { Message } from '@/types';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  Loader2,
  Download,
  Check,
  Wand2,
} from 'lucide-react';

interface ImageGenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGenModal({ isOpen, onClose }: ImageGenModalProps) {
  const { currentConversationId, createNewConversation, sendMessage } = useChat();
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid');
  const [aspect, setAspect] = useState<'1024x1024' | '1024x1792'>('1024x1024');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setGeneratedUrl(null);
    setRevisedPrompt(null);

    try {
      const res = await fetch('/api/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          size: aspect,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate image');
      }

      const data = await res.json();
      setGeneratedUrl(data.imageUrl);
      setRevisedPrompt(data.revisedPrompt);

      // Append image to active chat thread
      sendMessage(
        `![${prompt.trim()}](${data.imageUrl})\n\n*Prompt: "${prompt.trim()}"*`
      );
    } catch (err: any) {
      alert(`Image generation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-sm">NOVA AI Image Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Visual Concept & Prompt</label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A hyper-realistic editorial photograph of an architectural glass pavilion at sunset, cinematic lighting, 8k..."
              className="w-full p-3 rounded-xl border border-border bg-secondary/60 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Aesthetic Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-secondary/60 text-foreground focus:outline-none"
              >
                <option value="vivid">Vivid & Cinematic</option>
                <option value="natural">Natural & Realistic</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Aspect Ratio</label>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-border bg-secondary/60 text-foreground focus:outline-none"
              >
                <option value="1024x1024">Square (1:1)</option>
                <option value="1024x1792">Portrait (9:16)</option>
              </select>
            </div>
          </div>

          {/* Generated Result Preview */}
          {loading && (
            <div className="p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center space-y-2 bg-secondary/20">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <div className="font-semibold text-foreground">Synthesizing Imagery…</div>
              <p className="text-[11px] text-muted-foreground">Orchestrating diffusion weights</p>
            </div>
          )}

          {generatedUrl && !loading && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="relative rounded-xl overflow-hidden border border-border group">
                <img
                  src={generatedUrl}
                  alt={prompt}
                  className="w-full max-h-[280px] object-cover"
                />
                <a
                  href={generatedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/80 text-white text-xs font-medium flex items-center gap-1.5 backdrop-blur-md opacity-90 hover:opacity-100"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Open Full HD</span>
                </a>
              </div>
              <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Added to current conversation history!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-border flex justify-between items-center bg-secondary/20">
          <span className="text-[11px] text-muted-foreground">Powered by DALL-E 3 & Flux AI</span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border hover:bg-secondary text-muted-foreground text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl bg-foreground text-background font-medium text-xs shadow-sm transition-all ${
                prompt.trim() && !loading
                  ? 'hover:opacity-90'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              <span>{loading ? 'Generating…' : 'Generate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
