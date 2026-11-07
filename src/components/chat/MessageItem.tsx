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

  // ------------------------------------------------------------------
  // 1. HUMAN / USER MESSAGE — ALIGNED ON THE RIGHT SIDE
  // ------------------------------------------------------------------
  if (isUser) {
    return (
      <div className="w-full py-3 px-4 md:px-8 flex justify-end transition-colors group">
        <div className="max-w-xl sm:max-w-2xl flex flex-row-reverse items-start gap-2.5 sm:gap-3">
          {/* User Avatar on the Right */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center font-medium text-xs shadow-sm">
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
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1">
              {message.isVoice && (
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-medium">
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/80 text-xs"
                  >
                    {att.type.startsWith('image/') && att.base64Data ? (
                      <img
                        src={att.base64Data}
                        alt={att.name}
                        className="w-6 h-6 rounded object-cover"
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
              <div className="w-full min-w-[280px] sm:min-w-[380px] space-y-2 mt-1">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-secondary text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[90px]"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-secondary text-muted-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-xs rounded-lg bg-foreground text-background font-medium hover:opacity-90"
                  >
                    Save & Resend
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl rounded-tr-xs bg-secondary text-foreground border border-border/80 px-4 py-2.5 text-sm shadow-sm leading-relaxed max-w-full break-words text-left">
                {message.content}
              </div>
            )}

            {/* Quick Actions (Copy / Edit) */}
            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs"
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
        isError ? 'bg-red-500/5 border-y border-red-500/20' : 'bg-muted/15 border-y border-border/30'
      }`}
    >
      <div className="max-w-3xl flex items-start gap-3.5 w-full">
        {/* AI Avatar on the Left */}
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
              isError
                ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                : 'bg-foreground text-background'
            }`}
          >
            {isError ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
          </div>
        </div>

        {/* AI Message Content Column */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {model?.name || 'NOVA AI'}
              </span>
              {model && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-secondary text-muted-foreground font-mono">
                  {model.providerLabel}
                </span>
              )}
              {message.isVoice && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-medium">
                  Voice
                </span>
              )}
              <span className="opacity-70">{formatTimestamp(message.createdAt)}</span>
            </div>
          </div>

          {/* Web Search Citations */}
          {message.citations && message.citations.length > 0 && (
            <div className="pt-1 pb-2">
              <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Sources & References
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.citations.map((cite, idx) => (
                  <a
                    key={cite.id || idx}
                    href={cite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col p-2 rounded-lg border border-border/80 bg-background/50 hover:bg-secondary/70 transition-colors text-xs group/cite"
                  >
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground truncate max-w-[180px]">
                        {idx + 1}. {cite.source}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover/cite:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-muted-foreground truncate mt-0.5">{cite.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Main Message Body */}
          <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed break-words">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');

                  if (!inline && match) {
                    return (
                      <div className="relative group/code my-3 rounded-lg border border-border bg-secondary/80 overflow-hidden font-mono text-xs">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/40 text-muted-foreground text-[11px]">
                          <span className="uppercase font-semibold tracking-wider">{match[1]}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(codeString);
                            }}
                            className="flex items-center gap-1 hover:text-foreground transition-colors"
                            title="Copy code"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </button>
                        </div>
                        <div className="p-3 overflow-x-auto">
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

            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-amber-400 animate-pulse align-middle" />
            )}

            {isError && onRegenerate && (
              <div className="pt-2">
                <button
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Response</span>
                </button>
              </div>
            )}
          </div>

          {/* Action Toolbar on Hover */}
          <div className="flex items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
              title="Copy message"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-1.5 rounded-md hover:bg-secondary text-xs transition-colors ${
                isBookmarked ? 'text-amber-500 bg-amber-500/10' : 'text-muted-foreground hover:text-foreground'
              }`}
              title={isBookmarked ? 'Saved to bookmarks' : 'Bookmark message'}
            >
              <Bookmark className="w-3.5 h-3.5" />
            </button>

            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={handleSpeak}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground text-xs"
              title={isPlayingAudio ? 'Stop reading' : 'Read aloud'}
            >
              {isPlayingAudio ? (
                <VolumeX className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
