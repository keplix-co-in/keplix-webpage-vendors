'use client';

import { useCallback, useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { fetchMaintenanceStatus, onBackendMaintenance } from '@/lib/maintenance';

/**
 * Full-page "Under maintenance" screen for the partner portal.
 *
 * On when https://keplix.co.in/status.json says so, or when the backend
 * answers 503 MAINTENANCE (lib/api.js emits that). Checked on load and each
 * time the tab becomes visible again. Fails open: until the first check
 * answers, and on any error, the portal renders normally. Nobody is logged
 * out; when maintenance ends, Retry (or returning to the tab) brings the
 * portal back as it was.
 */
export default function MaintenanceGate({ children }) {
  const [fileStatus, setFileStatus] = useState(null);
  const [backendMessage, setBackendMessage] = useState(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    const s = await fetchMaintenanceStatus();
    setFileStatus(s);
    // A fresh check is the only way out of a backend-reported maintenance:
    // clear it so Retry recovers once the backend flag is off. If it is still
    // on, the next API call reports it again.
    setBackendMessage(null);
  }, []);

  const retry = async () => {
    setChecking(true);
    await check();
    setChecking(false);
  };

  useEffect(() => {
    // check() only sets state after its await (a network fetch), never
    // synchronously, which is what this rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    check();
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    const off = onBackendMaintenance((m) => setBackendMessage(m || ''));
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      off();
    };
  }, [check]);

  const on = fileStatus?.maintenance || backendMessage !== null;
  if (!on) return children;

  const message =
    fileStatus?.message ||
    backendMessage ||
    'The Keplix Partner portal is down for planned maintenance. Your account and bookings are safe.';

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div role="alert" className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-[var(--color-ink-body)]">We&apos;ll be right back</h1>
        <p className="mt-3 text-[15px] text-[var(--color-ink-secondary)]">{message}</p>
        {fileStatus?.until && (
          <p className="mt-2 text-[14px] text-[var(--color-ink-secondary)]">Expected back: {fileStatus.until}</p>
        )}
        <div className="mt-6">
          <Button onClick={retry} loading={checking} fullWidth>
            Retry
          </Button>
        </div>
        <p className="mt-4 text-[13px] text-[var(--color-ink-secondary)]">
          Need help? <a className="underline" href="mailto:support@keplix.co.in">support@keplix.co.in</a>
        </p>
      </div>
    </main>
  );
}
