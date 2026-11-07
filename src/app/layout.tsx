import type { Metadata, Viewport } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOVA AI — Multi-Model Intelligence',
  description:
    'Production-grade multi-model AI platform integrating OpenAI GPT, Google Gemini, and Anthropic Claude with low-latency live voice.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-hidden selection:bg-neutral-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
