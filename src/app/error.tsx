'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App Error Boundary caught error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/30 flex items-center justify-center font-bold text-xl mb-4">
        !
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        {error.message || 'An unexpected error occurred while processing your request.'}
      </p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        Try Again
      </button>
    </div>
  );
}

