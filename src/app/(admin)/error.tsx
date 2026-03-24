'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-red-700 mb-2">Something went wrong</h2>
        <pre className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-3 overflow-auto max-h-60 mb-4">
          {error.message || 'Unknown error'}
          {error.digest ? `\n\nDigest: ${error.digest}` : ''}
        </pre>
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
