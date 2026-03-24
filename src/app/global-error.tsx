'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%', margin: '0 24px', padding: '24px', background: 'white', borderRadius: 12, border: '1px solid #fecaca', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#b91c1c', fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Application Error</h2>
          <pre style={{ fontSize: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 12, overflow: 'auto', maxHeight: 200, marginBottom: 16, color: '#334155' }}>
            {error.message || 'Unknown error'}
            {'\n\nStack:\n'}{error.stack || 'No stack available'}
            {error.digest ? `\n\nDigest: ${error.digest}` : ''}
          </pre>
          <button
            onClick={reset}
            style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
