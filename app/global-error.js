'use client';

/**
 * Last resort: an error thrown by the root layout itself (or by Providers),
 * which app/error.js sits inside and therefore cannot catch.
 *
 * WHY no shared components, fonts or Tailwind classes here: global-error
 * replaces the root layout, so it renders its own document and none of
 * globals.css or the DM Sans variable is loaded — every style has to be inline
 * or it silently renders unstyled. See
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md.
 */
export default function GlobalError({ error, retry, reset }) {
  const onRetry = retry ?? reset;

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '40px 28px',
          background: '#f9fafb',
          color: '#111827',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <title>Something went wrong — Keplix Partner</title>
        <div style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>
            The portal could not start
          </h1>
          {/* Deliberately generic: the underlying error text can contain server
              internals, so only the digest is ever shown. */}
          <p style={{ fontSize: 13, lineHeight: 1.65, color: '#6b7280', margin: 0 }}>
            Something failed before the page could load. Please try again, or reload the browser if
            this keeps happening.
          </p>
          <button
            type="button"
            onClick={() => onRetry?.()}
            style={{
              marginTop: 24,
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              color: '#ffffff',
              background: '#4E46B4',
              border: '1px solid #4E46B4',
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          {error?.digest && (
            <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 20 }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
