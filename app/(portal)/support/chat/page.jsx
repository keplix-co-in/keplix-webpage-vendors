'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { usePortalHeader } from '../../layout';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatTime } from '@/lib/format';

/**
 * Support chat has no backend — the mobile app keeps the thread locally under
 * `keplix_support_chat_v1` and hands the conversation to email. This mirrors
 * that exactly rather than implying a live agent is reading.
 */
const STORAGE_KEY = 'keplix_support_chat_v1';
const SUPPORT_EMAIL = 'support@keplix.co.in';

export default function SupportChatPage() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const threadRef = useRef(null);

  usePortalHeader('Keplix support', 'Write down the problem, then send it to the partner team');

  // Reading the saved thread is a one-time load from an external store, which
  // is what an effect is for; the lint rule cannot tell that apart from state
  // that should have been derived. It cannot be a lazy useState initializer
  // either — that runs during the server render, where localStorage does not
  // exist, and the differing markup would break hydration.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved) setMessages(JSON.parse(saved));
    } catch {
      // Storage unavailable — the thread simply starts empty.
    }
  }, []);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  const persist = (next) => {
    setMessages(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Not fatal: the note stays on screen for this session.
    }
  };

  const add = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    persist([...messages, { id: Date.now(), text, at: new Date().toISOString() }]);
    setDraft('');
  };

  const mailtoHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    'Keplix Partner support request'
  )}&body=${encodeURIComponent(messages.map((m) => m.text).join('\n\n'))}`;

  return (
    <div className="max-w-[720px]">
      <div
        className="rounded-[var(--radius-small)] px-4 py-3 mb-4 text-[12.5px] leading-[1.6]"
        style={{ background: 'var(--color-warning-tint)', color: 'var(--color-warning-text)' }}
      >
        These notes are saved on this device only. Send them to {SUPPORT_EMAIL} when you are ready —
        that is what reaches the partner team.
      </div>

      <Card padded={false} className="flex flex-col" style={{ height: '58vh' }}>
        <div ref={threadRef} className="kx-scroll flex-1 overflow-y-auto p-5 flex flex-col gap-2.5">
          {messages.length === 0 ? (
            <p className="text-[13px] text-[var(--color-muted)] m-auto text-center max-w-[360px] leading-[1.6]">
              Describe what went wrong — the booking, what you expected, and what happened instead.
            </p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="max-w-[72%] px-3.5 py-2.5 self-end"
                style={{
                  background: 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: '16px 16px 4px 16px',
                }}
              >
                <div className="text-[13px] leading-[1.55]">{message.text}</div>
                <div className="text-[10.5px] mt-1" style={{ color: 'rgba(255,255,255,.7)' }}>
                  {formatTime(message.at)}
                </div>
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={add}
          className="p-3.5 flex items-center gap-2.5"
          style={{ borderTop: '1px solid var(--color-divider)' }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a note…"
            className="flex-1 rounded-[var(--radius-pill)] px-4 py-3 text-[13.5px] outline-none"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Add note"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <Send size={16} />
          </button>
        </form>
      </Card>

      <div className="flex gap-3 mt-4 flex-wrap">
        <a href={mailtoHref}>
          <Button size="md" disabled={messages.length === 0}>
            Send to support by email
          </Button>
        </a>
        {messages.length > 0 && (
          <Button variant="outline" size="md" onClick={() => persist([])}>
            Clear notes
          </Button>
        )}
      </div>
    </div>
  );
}
