'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Google sign-in via Google Identity Services.
 *
 * The backend verifies the id token against GOOGLE_ALLOWED_AUDIENCES, so the
 * web OAuth client ID must be listed there — otherwise every attempt comes back
 * rejected even though the browser side succeeded.
 *
 * GIS renders its own button, but the handoff specifies a white pill with a
 * 1.5px border and the four-colour G, so the real button is kept invisible and
 * the styled one triggers it.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleButton({ label = 'Continue with Google', onCredential, disabled }) {
  const hiddenRef = useRef(null);
  const [ready, setReady] = useState(false);

  const handleCredential = useCallback(
    (response) => {
      if (response?.credential) onCredential(response.credential);
    },
    [onCredential]
  );

  useEffect(() => {
    if (!CLIENT_ID) return undefined;

    const init = () => {
      if (!window.google?.accounts?.id || !hiddenRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      window.google.accounts.id.renderButton(hiddenRef.current, { type: 'standard', width: 320 });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = init;
    document.head.appendChild(script);

    return () => {
      script.onload = null;
    };
  }, [handleCredential]);

  if (!CLIENT_ID) return null;

  const click = () => {
    // GIS only accepts a click on the element it rendered itself.
    hiddenRef.current?.querySelector('div[role=button]')?.click();
  };

  return (
    <>
      <div ref={hiddenRef} className="sr-only h-0 overflow-hidden" aria-hidden="true" />
      <button
        type="button"
        onClick={click}
        disabled={disabled || !ready}
        className="w-full flex items-center justify-center gap-[11px] bg-white text-[#1F2937] text-[14px] font-bold rounded-[var(--radius-pill)] px-6 py-3.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ border: '1.5px solid var(--color-line-strong)' }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.5 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.1 24.5c0-1.6-.1-2.8-.4-4.1H24v8.1h12.6c-.3 2.1-1.6 5.2-4.7 7.3l7.6 5.9c4.5-4.2 6.6-10.2 6.6-17.2z"
          />
          <path
            fill="#FBBC05"
            d="M10.4 28.7A14.6 14.6 0 019.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 000 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 11.9-2.1 15.6-5.8l-7.6-5.9c-2 1.4-4.8 2.4-8 2.4-6.4 0-11.7-3.7-13.6-8.9l-7.8 6.1C6.4 42.6 14.5 48 24 48z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </>
  );
}
