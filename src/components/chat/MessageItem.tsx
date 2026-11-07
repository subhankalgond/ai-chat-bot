'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Message, SearchCitation } from '@/types';
import { formatTimestamp } from '@/lib/utils';
import { getModelById } from '@/lib/models/registry';
import {
  Copy,
  Check,
  RotateCcw,
  Pencil,
  Volume2,
  VolumeX,
  ExternalLink,
  FileText,
  Sparkles,
  User,
  Mic,
  AlertTriangle,
  Bookmark,
  RefreshCw,
  Globe,
  Terminal,
} from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (newContent: string) => void;
  onRegenerate?: () => void;
}

export function MessageItem({
  message,
  isStreaming,
  onEdit,
  onRegenerate,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const isUser = message.role === 'user';
  const isError = message.status === 'error';
  const model = message.modelId ? getModelById(message.modelId) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit?.(editContent);
      setIsEditing(false);
    } else {
      setIsEditing(false);
    }
  };

  const handleSpeak = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Provider styling helpers
  const getProviderDotColor = (provider?: string) => {
    switch (provider) {
      case 'google':
        return 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
      case 'openai':
        return 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]';
      case 'anthropic':
        return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      default:
        return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]';
    }
  };

  // ------------------------------------------------------------------
  // 1. HUMAN / USER MESSAGE — ALIGNED ON THE RIGHT SIDE
  // ------------------------------------------------------------------
  if (isUser) {
    return (
      <div className="w-full py-3.5 px-4 md:px-8 flex justify-end transition-colors group">
        <div className="max-w-xl sm:max-w-2xl flex flex-row-reverse items-start gap-3">
          {/* User Avatar on the Right */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center font-semibold text-xs shadow-sm ring-1 ring-border">
              {message.isVoice ? (
                <Mic className="w-4 h-4 text-emerald-400" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* User Message Bubble Container */}
          <div className="flex flex-col items-end min-w-0">
            {/* Timestamp & Voice Badge */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1.5 font-medium">
              {message.isVoice && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Voice
                </span>
              )}
              <span>{formatTimestamp(message.createdAt)}</span>
              <span className="font-semibold text-foreground">You</span>
            </div>

            {/* Attached Files */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="flex flex-wrap justify-end gap-2 mb-2">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border bg-secondary/80 text-xs shadow-sm"
                  >
                    {att.type.startsWith('image/') && att.base64Data ? (
                      <img
                        src={att.base64Data}
                        alt={att.name}
                        className="w-6 h-6 rounded-lg object-cover"
                      />
                    ) : (
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium truncate max-w-[140px]">{att.name}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Message Bubble Body */}
            {isEditing ? (
              <div className="w-full min-w-[280px] sm:min-w-[400px] space-y-2 mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/40 resize-y min-h-[90px]"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-border hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3.5 py-1.5 text-xs rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Save & Resend
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl rounded-tr-xs bg-secondary/90 text-foreground border border-border/80 px-4 py-2.5 text-sm shadow-sm leading-relaxed max-w-full break-words text-left">
                {message.content}
              </div>
            )}

            {/* Quick Actions (Copy / Edit) */}
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
                  title="Edit message"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 2. AI / ASSISTANT MESSAGE — ALIGNED ON THE LEFT SIDE
  // ------------------------------------------------------------------
  return (
    <div
      className={`w-full py-5 px-4 md:px-8 flex justify-start transition-colors group ${
        isError ? 'bg-red-500/5 border-y border-red-500/20' : 'hover:bg-muted/10'
      }`}
    >
      <div className="max-w-3xl flex items-start gap-3.5 w-full">
        {/* AI Avatar on the Left with Glowing Ring when Streaming */}
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm transition-all ${
              isError
                ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                : isStreaming
                ? 'bg-neutral-900 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.2)] ring-1 ring-amber-500/30'
                : 'bg-neutral-900 text-amber-400 border border-neutral-800'
            }`}
          >
            {isError ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : isStreaming ? (
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
          </div>
        </div>

        {/* AI Message Content Column */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header Metadata with Model Pill & Glowing Status Dot */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${getProviderDotColor(model?.provider)}`} />
              <span className="font-semibold text-foreground text-xs">
                {model?.name || 'NOVA AI'}
              </span>
              {model && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-secondary/80 border border-border/60 text-muted-foreground font-mono font-medium">
                  {model.providerLabel}
                </span>
              )}
              {message.isVoice && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Voice
                </span>
              )}
              <span className="text-[11px] opacity-70">{formatTimestamp(message.createdAt)}</span>
            </div>
          </div>

          {/* Web Search Citations (21st.dev Style Card Grid) */}
          {message.citations && message.citations.length > 0 && (
            <div className="pt-1 pb-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" /> Sources & Grounded References
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.citations.map((cite, idx) => (
                  <a
                    key={cite.id || idx}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-2.5 rounded-xl border border-border/80 bg-background/60 hover:bg-secondary/70 hover:border-foreground/30 transition-all text-xs group/cite shadow-xs"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground truncate max-w-[200px]">
                        {idx + 1}. {cite.source}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover/cite:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-muted-foreground truncate mt-1 text-[11px]">{cite.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Thinking & Processing State (Three UI / 21st.dev Style) */}
          {isStreaming && !message.content.trim() ? (
            <div className="py-3 px-4 rounded-2xl bg-secondary/40 border border-border/80 backdrop-blur-md max-w-fit flex flex-col gap-2.5 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                {/* 3 Animated Bouncing Glowing Dots */}
                <div className="flex items-center gap-1.5 px-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 animate-bounce [animation-delay:-0.32s] shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 animate-bounce [animation-delay:-0.16s] shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 animate-bounce shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="tracking-wide">Thinking with {model?.name || 'NOVA AI'}...</span>
                </div>
              </div>

              {/* Shimmer Bar Indicator */}
              <div className="relative w-48 h-1 bg-muted/60 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent animate-shimmer" />
              </div>
            </div>
          ) : (
            /* Main Message Body & Progressive Stream Rendering */
            <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed break-words font-sans">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeString = String(children).replace(/\n$/, '');

                    if (!inline && match) {
                      return (
                        <div className="relative group/code my-3 rounded-xl border border-border/80 bg-neutral-950/90 text-neutral-100 overflow-hidden font-mono text-xs shadow-md">
                          {/* MacOS-Style Header Bar with Language Badge & Copy Button */}
                          <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800 bg-neutral-900/90 text-neutral-400 text-[11px]">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                              </div>
                              <span className="uppercase font-semibold tracking-wider text-[10px] text-neutral-300 ml-1.5 flex items-center gap-1">
                                <Terminal className="w-3 h-3 text-neutral-400" />
                                {match[1]}
                              </span>
                            </div>

                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(codeString);
                              }}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-neutral-800 hover:text-white transition-colors"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>

                          <div className="p-3.5 overflow-x-auto leading-relaxed">
                            <code>{children}</code>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>

              {/* Streaming Cursor Beam */}
              {isStreaming && (
                <span className="inline-flex items-center ml-1 align-baseline">
                  <span className="inline-block w-2 h-4 rounded-xs bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
                </span>
              )}

              {/* Inline Retry Button on Error */}
              {isError && onRegenerate && (
                <div className="pt-2">
                  <button
                    onClick={onRegenerate}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Response</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Toolbar on Hover */}
          {!isStreaming && (
            <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`p-1.5 rounded-lg hover:bg-secondary text-xs transition-colors ${
                  isBookmarked ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground hover:text-foreground'
                }`}
                title={isBookmarked ? 'Saved to bookmarks' : 'Bookmark message'}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
                  title="Regenerate response"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={handleSpeak}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs transition-colors"
                title={isPlayingAudio ? 'Stop reading' : 'Read aloud'}
              >
                {isPlayingAudio ? (
                  <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
