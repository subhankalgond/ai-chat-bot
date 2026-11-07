'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Application Error</h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {error.message || 'A critical error occurred.'}
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90"
        >
          Reset Application
        </button>
      </body>
    </html>
  );
}
