import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl mb-4 shadow-md">
        N
      </div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">404 — Page Not Found</h1>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        The requested resource or page does not exist. Return to NOVA AI to start a conversation.
      </p>
      <Link
        href="/"
        className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        Return to Home
      </Link>
    </div>
  );
}
