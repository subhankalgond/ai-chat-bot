'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import { Attachment } from '@/types';
import {
  ArrowUp,
  Square,
  Paperclip,
  Globe,
  Mic,
  MicOff,
  Radio,
  X,
  FileText,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export function Composer() {
  const {
    sendMessage,
    isStreaming,
    stopGeneration,
    webSearchEnabled,
    setWebSearchEnabled,
    setVoiceModeOpen,
    setImageGenOpen,
  } = useChat();

  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isListeningDictation, setIsListeningDictation] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Keyboard shortcut listener (Escape to stop generation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isStreaming) {
        stopGeneration();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStreaming, stopGeneration]);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isStreaming) {
      sendMessage(input.trim(), attachments);
      setInput('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // File Upload Handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.attachment) {
            setAttachments((prev) => [...prev, data.attachment]);
          }
        } else {
          const err = await res.json();
          alert(`File upload failed: ${err.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        alert(`Error uploading ${file.name}: ${err.message}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Mic dictation into composer
  const toggleDictation = useCallback(() => {
    if (isListeningDictation) {
      recognitionRef.current?.stop();
      setIsListeningDictation(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListeningDictation(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput((prev) => (prev ? `${prev} ${finalTranscript}` : finalTranscript));
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      setIsListeningDictation(false);
    };

    recognition.onend = () => {
      setIsListeningDictation(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListeningDictation]);

  const canSubmit = (input.trim().length > 0 || attachments.length > 0) && !isStreaming;

  return (
    <div className="max-w-3xl mx-auto w-full px-4 pb-4">
      {/* Attachment Previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-xl bg-secondary/50 border border-border">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background text-xs shadow-sm"
            >
              {att.type.startsWith('image/') && att.base64Data ? (
                <img
                  src={att.base64Data}
                  alt={att.name}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="max-w-[140px] truncate font-medium">{att.name}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative flex flex-col rounded-2xl border border-border bg-background shadow-lg shadow-black/5 dark:shadow-black/20 focus-within:border-ring/80 transition-all">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, analyze documents, or code with NOVA…"
          className="w-full pt-3.5 pb-2 px-4 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none resize-none max-h-[220px] leading-relaxed"
        />

        {/* Bottom Action Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40">
          {/* Left Toolbar Controls */}
          <div className="flex items-center gap-1">
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Attach PDF, Word, Excel, or Image"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </button>

            {/* AI Image Studio Button */}
            <button
              type="button"
              onClick={() => setImageGenOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Generate Image with AI (DALL-E 3 & Flux)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={() => setWebSearchEnabled((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                webSearchEnabled
                  ? 'bg-blue-500/15 text-blue-500 border border-blue-500/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title="Toggle Live Web Search"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Dictation Mic Button */}
            <button
              type="button"
              onClick={toggleDictation}
              className={`p-2 rounded-lg text-xs font-medium transition-colors ${
                isListeningDictation
                  ? 'bg-red-500/15 text-red-500 animate-pulse'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
              title={isListeningDictation ? 'Stop voice typing' : 'Voice typing'}
            >
              {isListeningDictation ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Live Voice Mode Button */}
            <button
              type="button"
              onClick={() => setVoiceModeOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground border border-border text-xs font-medium shadow-sm transition-all group"
              title="Launch Live Real-Time Voice Conversation"
            >
              <Radio className="w-3.5 h-3.5 text-amber-400 group-hover:animate-pulse" />
              <span className="hidden sm:inline">Live Voice</span>
            </button>

            {/* Stop or Send Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="w-8 h-8 rounded-xl bg-foreground text-background flex items-center justify-center hover:opacity-90 transition-opacity"
                title="Stop generation (Esc)"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSubmit}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                  canSubmit
                    ? 'bg-foreground text-background hover:opacity-90 shadow-sm'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                }`}
                title="Send message (Enter)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

