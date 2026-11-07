import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOVA AI — Multi-Model Intelligence',
  description:
    'Production-grade multi-model AI platform integrating OpenAI GPT, Google Gemini, and Anthropic Claude with low-latency live voice.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
          crossOrigin="anonymous"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased overflow-hidden selection:bg-neutral-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}

