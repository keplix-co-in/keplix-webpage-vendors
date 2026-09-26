'use client';

import { useEffect, useRef, useState } from 'react';
import { BellRing, Volume2, VolumeX } from 'lucide-react';
import { Toggle } from '@/components/ui/Field';
import { isSoundEnabled, playAlertBeep, setSoundEnabled } from '@/lib/alertSound';
import {
  isBrowserNotifyEnabled,
  isBrowserNotifySupported,
  notifyPermission,
  setBrowserNotifyEnabled,
} from '@/lib/browserNotify';
import { disableWebPush, enableWebPush, isWebPushOn, isWebPushSupported } from '@/lib/webPush';

/**
 * How the portal gets a vendor's attention, mirroring the app's alert beep.
 * Three independent switches, each off until the vendor turns it on (the click
 * is also what browsers require before they allow sound or notifications):
 *
 *   Sound             a beep in this tab when a new request arrives
 *   Desktop alerts    a notification when this tab is open but hidden
 *   Background alerts a push that arrives even with the browser closed
 */
export default function AlertSettings() {
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(false);
  const [desktop, setDesktop] = useState(false);
  const [background, setBackground] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const rootRef = useRef(null);

  const backgroundSupported = isWebPushSupported();

  // Read the saved choices after mount (localStorage is not available on the
  // server, so initialising state from it would mismatch the server HTML).
  useEffect(() => {
    let cancelled = false;
    isWebPushOn().then((on) => {
      if (cancelled) return;
      setSound(isSoundEnabled());
      setDesktop(isBrowserNotifyEnabled());
      setBackground(on);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const permission = notifyPermission();
  const anyOn = sound || desktop || background;

  const toggleSound = (next) => {
    setMessage('');
    setSoundEnabled(next);
    setSound(next);
    // The click that turned it on is what lets the browser play audio later, so
    // play the beep once now: the vendor hears what a new request sounds like.
    if (next) {
      playAlertBeep({ force: true }).then((played) => {
        if (!played) setMessage('Your browser blocked the sound. Click on the page and try again.');
      });
    }
  };

  const toggleDesktop = async (next) => {
    setMessage('');
    const on = await setBrowserNotifyEnabled(next);
    setDesktop(on);
    if (next && !on) setMessage('Notifications are blocked. Allow them in your browser settings.');
  };

  const toggleBackground = async (next) => {
    setMessage('');
    setBusy(true);
    if (next) {
      const result = await enableWebPush();
      setBackground(result.ok);
      if (!result.ok) setMessage(result.error);
      // Background alerts need the notification permission too, so it doubles
      // as the desktop-alert switch.
      if (result.ok) setDesktop(await setBrowserNotifyEnabled(true));
    } else {
      await disableWebPush();
      setBackground(false);
    }
    setBusy(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Alert settings"
        className="w-[38px] h-[38px] rounded-full flex items-center justify-center cursor-pointer"
        style={{ border: '1px solid var(--color-line)', background: 'var(--color-canvas)' }}
      >
        {sound ? (
          <Volume2 size={18} color="var(--color-primary)" />
        ) : anyOn ? (
          <BellRing size={18} color="var(--color-primary)" />
        ) : (
          <VolumeX size={18} color="var(--color-ink-body)" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Alert settings"
          className="absolute right-0 top-[46px] w-[320px] bg-white rounded-[var(--radius-portal)] p-4 z-40"
          style={{ border: '1px solid var(--color-line)', boxShadow: 'var(--shadow-modal)' }}
        >
          <p className="text-[14px] font-bold">New request alerts</p>
          <p className="text-[12px] text-[var(--color-muted)] mt-0.5 mb-3">
            So you never miss a booking while you are under a car.
          </p>

          <Row
            title="Sound"
            detail="Play the alert beep in this tab until you accept or decline."
            checked={sound}
            onChange={toggleSound}
          />
          {isBrowserNotifySupported() && (
            <Row
              title="Desktop alerts"
              detail="Show a notification when this tab is open but hidden."
              checked={desktop}
              onChange={toggleDesktop}
              disabled={permission === 'denied'}
            />
          )}
          {backgroundSupported && (
            <Row
              title="Background alerts"
              detail="Get an alert even when the browser is closed."
              checked={background}
              onChange={toggleBackground}
              disabled={busy || permission === 'denied'}
            />
          )}

          {permission === 'denied' && (
            <p className="text-[12px] text-[var(--color-danger)] mt-3">
              Notifications are blocked for this site. Allow them in your browser settings to
              turn these on.
            </p>
          )}
          {message && (
            <p role="alert" className="text-[12px] text-[var(--color-danger)] mt-3">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ title, detail, checked, onChange, disabled = false }) {
  return (
    <div
      className="flex items-start justify-between gap-3 py-2.5"
      style={{ borderTop: '1px solid var(--color-divider)', opacity: disabled ? 0.55 : 1 }}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-bold">{title}</p>
        <p className="text-[12px] text-[var(--color-muted)] leading-[1.45]">{detail}</p>
      </div>
      <Toggle
        checked={checked}
        onChange={(next) => !disabled && onChange(next)}
        label={title}
      />
    </div>
  );
}
