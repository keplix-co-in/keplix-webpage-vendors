'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Google sign-in via Google Identity Services.
 *
 * The backend verifies the id token against GOOGLE_ALLOWED_AUDIENCES, so the
 * web OAuth client ID must be listed there — otherwise every attempt comes back
 * rejected even though the browser side succeeded.
 *
 * Google's own rendered button is shown (pill shape, outline theme). An
 * invisible GIS button driven by a styled one does not work: GIS puts the
 * clickable element in a cross-origin iframe.
 *
 * The OAuth client must also list this site under "Authorized JavaScript
 * origins" in Google Cloud, or GIS logs "origin is not allowed" and the
 * popup never opens.
 */
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Lets a screen hide its "OR" divider when there is no Google button to divide. */
export const isGoogleConfigured = Boolean(CLIENT_ID);

export default function GoogleButton({ label = 'Continue with Google', onCredential, disabled }) {
  const hostRef = useRef(null);
  const [ready, setReady] = useState(false);

  // onCredential is a new function on every parent render. Reading it through a
  // ref keeps the effect below from re-running GIS initialize/renderButton on
  // each render (Google warns about repeat initialize, and the button flickers).
  const onCredentialRef = useRef(onCredential);
  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  const handleCredential = useCallback((response) => {
    if (response?.credential) onCredentialRef.current?.(response.credential);
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;

    const init = () => {
      if (!window.google?.accounts?.id || !hostRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      const width = Math.min(400, Math.max(200, hostRef.current.parentElement?.clientWidth || 320));
      window.google.accounts.id.renderButton(hostRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: label === 'Sign up with Google' ? 'signup_with' : 'continue_with',
        logo_alignment: 'center',
        width,
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
      return undefined;
    }

    // GIS is ~150 KB of third-party JS (gsi/client plus what it pulls from
    // gstatic). Injecting it during hydration made it compete with the page's
    // own chunks and font for bandwidth, and Lighthouse put /welcome's mobile
    // LCP at 4.9s. Waiting for idle time lets the page paint first. A grey
    // placeholder holds the space until GIS has drawn its button.
    let script = null;
    const load = () => {
      if (window.google?.accounts?.id) {
        init();
        return;
      }
      script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', init);
        return;
      }
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.addEventListener('load', init);
      document.head.appendChild(script);
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(load, { timeout: 2000 })
      : window.setTimeout(load, 1);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      script?.removeEventListener('load', init);
    };
  }, [handleCredential, label]);

  if (!CLIENT_ID) return null;

  // GIS draws its button inside a cross-origin iframe, so a synthetic .click()
  // from our own styled button never reaches it -- that proxy pattern is why
  // the old button did nothing. Show Google's real button instead; the
  // placeholder only holds the space (same height) until GIS has drawn it.
  return (
    <div className="w-full flex justify-center" style={{ minHeight: 44 }}>
      <div
        ref={hostRef}
        aria-label={label}
        className={disabled ? 'pointer-events-none opacity-60' : undefined}
      />
      {!ready && (
        <div className="w-full max-w-[400px] h-[44px] rounded-[var(--radius-pill)] bg-[#F3F4F6]" aria-hidden="true" />
      )}
    </div>
  );
}
