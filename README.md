# NOVA AI — Multi-Model Conversational AI Platform
### ChatGPT + Google Gemini + Anthropic Claude + Real-Time Voice

NOVA AI is a complete, production-grade, multi-model conversational AI platform that unites the capabilities of OpenAI GPT, Google Gemini, and Anthropic Claude with an interruptible real-time voice experience, multimodal document intelligence, and web search citations.

---

## 🌟 Key Features

### 1. Unified Multi-Model Engine
- **OpenAI GPT:** GPT-4o, GPT-4o Mini, o3-mini (Reasoning)
- **Google Gemini:** Gemini 2.0 Flash, Gemini 1.5 Pro (2M Context), Gemini 1.5 Flash
- **Anthropic Claude:** Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- **Seamless Provider Switching:** Switch mid-conversation between GPT, Gemini, and Claude without losing context or chat history.

### 2. Dual Interaction Paradigms
- **ChatGPT-Level Text Chat:**
  - Token-by-token progressive streaming
  - Rich Markdown, LaTeX equations ($ and $$ with KaTeX), syntax-highlighted code blocks with copy buttons, formatted tables, lists, and quotes
  - Message editing, response regeneration, instant stream cancellation (Esc)
  - Auto-generated conversation titles, search, pin/unpin, and JSON conversation exports
- **Dedicated Live Voice Mode:**
  - Fullscreen real-time voice modal with HTML5 Canvas reactive audio visualizer
  - Web Audio API `AnalyserNode` connected to microphone frequency data and speech output
  - Status indicators: `Connecting`, `Listening`, `Processing`, `Speaking`, `Interrupted`
  - Automatic turn detection and conversational pauses
  - Instant speech interruption (cuts off assistant speech immediately when the user speaks)
  - Real-time live transcript overlay

### 3. Unified Context Continuity (Chat & Voice Together)
- **Chat to Voice:** When entering voice mode, the voice engine inherits previous text messages, attachments, and answers.
- **Voice to Chat:** Real-time voice transcriptions (both user utterances and verbal AI answers) are automatically saved into the active conversation thread.
- **Mixed Interactions:** Type a prompt, upload a spreadsheet, speak via voice, and continue typing in the same thread.

### 4. Multimodal & Document Intelligence
- Supported formats: **PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP**
- Automatic tabular parsing with sheet extraction for spreadsheets
- Base64 encoding for vision-capable models (GPT-4o, Gemini 2.0 Flash, Claude 3.5 Sonnet)
- Document summarization, Q&A, and code explanations

### 5. Grounded Real-Time Web Search
- Dedicated search toggle with radar indicator
- Returns genuine search citations with favicon, title, snippet, and external link
- Cites authentic sources without hallucinations

### 6. Admin Telemetry & Health Console
- Live status verification for OpenAI, Google Gemini, Anthropic Claude, Web Search, and Supabase
- Request counts, token counters, estimated API expenditure calculations
- System health and architecture metrics

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node v24.21.0)
- npm or pnpm

### 2. Clone & Install
```bash
git clone <your-repo-url>
cd "ai chatbot"
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Fill in your provider credentials (server-side only, never leaked to the browser):
```env
# AI Providers
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIzaSy...
ANTHROPIC_API_KEY=sk-ant-...

# Supabase Auth & PostgreSQL Database (Optional for cloud sync, local storage works out-of-the-box)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Web Search (Optional: Tavily or Serper, fallbacks to DuckDuckGo)
TAVILY_API_KEY=tvly-...
SERPER_API_KEY=...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_SECRET_KEY=nova-admin-secure-key-2026
```

### 4. Run Locally
```bash
# Start Next.js development server
npm run dev

# Run full automated test suite
npm test

# Build production bundle
npm run build

# Start production server
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database & Supabase Migrations

If using Supabase for cloud persistence:
1. Open your Supabase Dashboard -> SQL Editor.
2. Run the script located in `supabase/migrations/001_initial_schema.sql`.
3. It creates:
   - `profiles` with Row Level Security (RLS)
   - `conversations` with user ownership policies
   - `messages` with foreign keys and cascade delete
   - `voice_sessions` with duration and transcript logging
   - `usage_logs` for token and cost tracking

---

## 🎨 UI/UX Design System
- **Editorial Minimalism:** Neutral palette inspired by 21st.dev and Three UI.
- **Dual Themes:** Warm light (`#fcfbf9`) and deep obsidian/charcoal (`#0e1013`).
- **Typography:** Balanced sans-serif system with mono accents for code and models.
- **Accessibility:** Keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline, `Esc` to stop generation, `Ctrl+N` for new chat).

---

## 🧪 Testing Summary
Run `npm test` to execute the comprehensive test suite covering:
- Provider Registry & verification
- Grounded Web Search
- File & Multimodal Document parsing
- Context continuity between Chat and Live Voice
- Formatting & UUID utilities
