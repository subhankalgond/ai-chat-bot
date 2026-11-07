'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@/context/ChatContext';
import { VoiceState } from '@/types';
import { getModelById, AVAILABLE_VOICES } from '@/lib/models/registry';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Radio,
  Sparkles,
  RefreshCw,
  Sliders,
  Check,
} from 'lucide-react';

export function VoiceWorkspace() {
  const {
    voiceModeOpen,
    setVoiceModeOpen,
    currentConversationId,
    messages,
    selectedModelId,
    addVoiceTurn,
  } = useChat();

  const [voiceState, setVoiceState] = useState<VoiceState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('alloy');
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeModel = getModelById(selectedModelId);
  const currentProvider = activeModel.provider;
  const availableVoices =
    AVAILABLE_VOICES[currentProvider] || AVAILABLE_VOICES.openai;

  // Interrupt AI speech immediately
  const interruptAISpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
    setVoiceState('listening');
  }, []);

  // Speak AI response with interruptibility and canvas animation
  const speakAIResponse = useCallback(
    (text: string) => {
      if (!text || !voiceModeOpen) return;

      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        setVoiceState('listening');
        return;
      }

      window.speechSynthesis.cancel();
      setVoiceState('speaking');
      setAiTranscript(text);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;

      // Select matching voice if available in browser
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const found = voices.find((v) =>
          v.name.toLowerCase().includes('natural') ||
          v.name.toLowerCase().includes('google') ||
          v.name.toLowerCase().includes('neural')
        );
        if (found) utterance.voice = found;
      }

      utterance.onend = () => {
        setVoiceState('listening');
        activeUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Utterance error:', e);
        setVoiceState('listening');
        activeUtteranceRef.current = null;
      };

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voiceModeOpen, voiceSpeed]
  );

  // Send turn to unified AI backend using full conversation context
  const processUserSpeech = useCallback(
    async (transcriptText: string) => {
      if (!transcriptText.trim()) return;

      setVoiceState('processing');
      setUserTranscript(transcriptText);

      // Construct history messages for context awareness (Chat-to-voice & Voice-to-chat)
      const recentHistory = messages.slice(-12);
      const conversationContext = [
        ...recentHistory,
        {
          id: 'voice-user-prompt',
          conversationId: currentConversationId || '',
          role: 'user' as const,
          content: transcriptText,
          createdAt: new Date().toISOString(),
        },
      ];

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: conversationContext,
            modelId: selectedModelId,
            systemPrompt:
              'You are speaking via Live Real-Time Voice. Respond conversationally, concisely, and with natural spoken cadence. Avoid long lists, raw markdown, or code dumps unless specifically asked.',
          }),
        });

        if (!response.ok) {
          throw new Error('AI Voice generation failed');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullAIResponse = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data:')) {
                try {
                  const event = JSON.parse(trimmed.slice(5).trim());
                  if (event.type === 'token') {
                    fullAIResponse += event.content;
                    setAiTranscript(fullAIResponse);
                  }
                } catch {}
              }
            }
          }
        }

        // Add both user transcript and AI response to the unified chat context
        addVoiceTurn(transcriptText, fullAIResponse);

        // Speak response out loud
        speakAIResponse(fullAIResponse);
      } catch (err: any) {
        console.error('Voice turn processing error:', err);
        setVoiceState('error');
        setAiTranscript(`Error: ${err.message}`);
        setTimeout(() => setVoiceState('listening'), 2500);
      }
    },
    [messages, currentConversationId, selectedModelId, addVoiceTurn, speakAIResponse]
  );

  // Setup Continuous Microphone and Web Audio Analyser
  useEffect(() => {
    if (!voiceModeOpen) return;

    let isSubscribed = true;

    async function initAudio() {
      try {
        setVoiceState('connecting');

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (!isSubscribed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        micStreamRef.current = stream;

        // Initialize Web Audio Context for visualizer
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        // Initialize Continuous Speech Recognition
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onstart = () => {
            if (isSubscribed) setVoiceState('listening');
          };

          let finalSentence = '';

          recognition.onresult = (event: any) => {
            // User speaks -> interrupt AI immediately
            if (activeUtteranceRef.current) {
              interruptAISpeech();
            }

            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalSentence += event.results[i][0].transcript;
              } else {
                interim += event.results[i][0].transcript;
              }
            }

            setUserTranscript(finalSentence || interim);

            // Natural pause / final sentence detected
            if (finalSentence.trim().length > 3) {
              const textToSend = finalSentence.trim();
              finalSentence = '';
              processUserSpeech(textToSend);
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('SpeechRecognition error:', e);
            if (e.error === 'not-allowed') {
              setVoiceState('error');
            }
          };

          recognition.onend = () => {
            // Auto restart if still in voice mode
            if (isSubscribed && voiceModeOpen && !isMuted) {
              try {
                recognition.start();
              } catch {}
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } else {
          setVoiceState('listening');
        }
      } catch (err: any) {
        console.error('Mic access error:', err);
        setVoiceState('error');
      }
    }

    initAudio();

    return () => {
      isSubscribed = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop());
        micStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceModeOpen, isMuted, interruptAISpeech, processUserSpeech]);

  // Audio Visualizer Canvas Loop
  useEffect(() => {
    if (!voiceModeOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Get frequency data
      let avgFreq = 0;
      if (analyserRef.current && !isMuted) {
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        avgFreq = sum / bufferLength;
      }

      // Draw glowing central orb
      const centerX = width / 2;
      const centerY = height / 2;
      const baseRadius = 60;
      const pulseMultiplier = voiceState === 'speaking' ? 1.5 : 1.0;
      const dynamicRadius = baseRadius + (avgFreq / 255) * 45 * pulseMultiplier;

      // Outer ambient glow
      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        dynamicRadius * 0.4,
        centerX,
        centerY,
        dynamicRadius * 2.2
      );

      if (voiceState === 'speaking') {
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
        gradient.addColorStop(0.5, 'rgba(234, 88, 12, 0.15)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (voiceState === 'listening') {
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        gradient.addColorStop(0.5, 'rgba(5, 150, 105, 0.12)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius * 2.2, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Fluid sinusoidal waveform ring around orb
      ctx.beginPath();
      const numPoints = 64;
      for (let i = 0; i <= numPoints; i++) {
        const theta = (i / numPoints) * Math.PI * 2;
        const wave = Math.sin(theta * 6 + angle) * (8 + (avgFreq / 255) * 20);
        const r = dynamicRadius + wave;
        const x = centerX + Math.cos(theta) * r;
        const y = centerY + Math.sin(theta) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle =
        voiceState === 'speaking'
          ? 'rgba(251, 191, 36, 0.8)'
          : voiceState === 'listening'
          ? 'rgba(52, 211, 153, 0.8)'
          : 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      angle += 0.04;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [voiceModeOpen, voiceState, isMuted]);

  const handleToggleMute = () => {
    if (micStreamRef.current) {
      const audioTrack = micStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  const handleEndVoice = () => {
    interruptAISpeech();
    setVoiceModeOpen(false);
  };

  if (!voiceModeOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-charcoal-950/95 backdrop-blur-xl text-white p-6 transition-all duration-300 animate-in fade-in">
      {/* Top Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
            <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight">NOVA Live Voice</span>
              <span className="px-2 py-0.5 rounded text-[11px] bg-white/10 text-white/80 border border-white/10">
                {activeModel.name}
              </span>
            </div>
            <p className="text-xs text-white/50">Native Real-Time Voice Pipeline</p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-colors"
            title="Voice Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <button
            onClick={handleEndVoice}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-white/70 hover:text-red-400 border border-white/10 transition-colors"
            title="Close Voice Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Voice Settings Flyout */}
      {showSettings && (
        <div className="absolute top-20 right-6 z-20 w-72 rounded-2xl bg-charcoal-900 border border-white/10 p-4 shadow-2xl space-y-4">
          <div className="font-semibold text-sm text-white/90">Voice Configuration</div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/60">Voice Profile</label>
            <div className="grid grid-cols-2 gap-1.5">
              {availableVoices.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-colors flex items-center justify-between ${
                    selectedVoice === v.id
                      ? 'bg-white/15 border-white/30 text-white'
                      : 'bg-white/5 border-transparent text-white/60 hover:text-white'
                  }`}
                >
                  <span>{v.name}</span>
                  {selectedVoice === v.id && <Check className="w-3 h-3 text-amber-400" />}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/60">
              <span>Speech Speed</span>
              <span>{voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.5"
              step="0.05"
              value={voiceSpeed}
              onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>
        </div>
      )}

      {/* Central Visualizer & Status */}
      <div className="relative flex flex-col items-center justify-center my-auto w-full max-w-lg">
        {/* Canvas Visualizer */}
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px]"
        />

        {/* State Pill Badge */}
        <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium tracking-wide">
          <span
            className={`w-2 h-2 rounded-full ${
              voiceState === 'listening'
                ? 'bg-emerald-400 animate-pulse'
                : voiceState === 'speaking'
                ? 'bg-amber-400 animate-pulse'
                : voiceState === 'processing'
                ? 'bg-blue-400 animate-spin'
                : 'bg-white/40'
            }`}
          />
          <span className="uppercase text-[11px] font-semibold text-white/80">
            {voiceState}
          </span>
        </div>

        {/* Live Subtitle Transcript Display */}
        <div className="mt-6 text-center max-w-md min-h-[64px] px-4 flex flex-col items-center justify-center">
          {voiceState === 'speaking' && aiTranscript && (
            <p className="text-white/90 text-sm sm:text-base font-normal leading-relaxed animate-in fade-in">
              "{aiTranscript.slice(-180)}"
            </p>
          )}
          {voiceState === 'listening' && (
            <p className="text-white/50 text-sm font-light italic">
              {userTranscript ? `"${userTranscript}"` : 'Listening… speak naturally'}
            </p>
          )}
          {voiceState === 'processing' && (
            <p className="text-white/60 text-sm flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking…
            </p>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="w-full max-w-md flex items-center justify-center gap-4 z-10 pb-4">
        {/* Mute Button */}
        <button
          onClick={handleToggleMute}
          className={`p-4 rounded-full border transition-all ${
            isMuted
              ? 'bg-red-500/20 border-red-500/40 text-red-400'
              : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Interrupt Speech Button */}
        {voiceState === 'speaking' && (
          <button
            onClick={interruptAISpeech}
            className="px-5 py-3 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold uppercase tracking-wider transition-all"
            title="Interrupt AI speaking"
          >
            Interrupt
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={handleEndVoice}
          className="px-6 py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-all shadow-lg shadow-red-900/40"
        >
          End Voice
        </button>
      </div>
    </div>
  );
}
