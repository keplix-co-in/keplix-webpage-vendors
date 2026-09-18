'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, EmptyState } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { chatAPI } from '@/api/customers';
import { unwrap } from '@/lib/queries';
import { acquireSocket, releaseSocket } from '@/lib/socket';
import { useAuth } from '@/context/AuthContext';
import { formatTime, initialsOf } from '@/lib/format';

export default function MessagesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  usePortalHeader('Messages', 'Booking-linked chats with your customers');

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => unwrap(await chatAPI.getConversations(), 'conversations'),
  });

  const active = useMemo(
    () => conversations.find((c) => String(c.id) === String(activeId)) ?? conversations[0] ?? null,
    [conversations, activeId]
  );

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', active?.id],
    enabled: Boolean(active?.id),
    queryFn: async () => unwrap(await chatAPI.getMessages(active.id), 'messages'),
  });

  // Join this conversation's room so the other side's messages arrive without
  // a refetch. The room id is the numeric conversation id.
  useEffect(() => {
    if (!active?.id) return undefined;

    const socket = acquireSocket();
    if (!socket) return undefined;

    const room = String(active.id);
    const join = () => socket.emit('join_room', room);
    const onMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['messages', active.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('connect', join);
    socket.on('receive_message', onMessage);
    if (socket.connected) join();

    return () => {
      socket.emit('leave_room', room);
      socket.off('connect', join);
      socket.off('receive_message', onMessage);
      releaseSocket();
    };
  }, [active?.id, queryClient]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;

    setSending(true);
    const result = await chatAPI.sendMessage({ conversationId: active.id, message_text: text });
    setSending(false);

    if (result?.success) {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['messages', active.id] });
    } else {
      toast.error(result?.error || 'Message not sent');
    }
  };

  const isMine = (message) =>
    String(message.sender_id ?? message.senderId ?? message.sender?.id) === String(user?.id);

  if (!isLoading && conversations.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No conversations yet"
          body="Chats open from a booking — when a customer messages you about a job, it appears here."
        />
      </Card>
    );
  }

  return (
    <div
      className="grid gap-5 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,320px) minmax(0,1fr)' }}
    >
      <Card padded={false} className="min-w-0 overflow-hidden">
        {conversations.map((conversation) => {
          const selected = String(conversation.id) === String(active?.id);
          const name = conversation.customer?.name ?? conversation.customer_name ?? 'Customer';

          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setActiveId(conversation.id)}
              className="w-full text-left px-4 py-3.5 flex items-center gap-3"
              style={{
                background: selected ? 'var(--color-primary-tint)' : 'white',
                borderBottom: '1px solid var(--color-divider)',
                cursor: 'pointer',
              }}
            >
              <span
                className="w-9 h-9 rounded-full text-white text-[13px] font-bold flex items-center justify-center shrink-0"
                style={{ background: 'var(--color-primary)' }}
              >
                {initialsOf(name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold truncate">{name}</span>
                <span className="block text-[12px] text-[var(--color-muted)] truncate">
                  {conversation.booking?.service?.name ?? conversation.last_message ?? 'Booking chat'}
                </span>
              </span>
            </button>
          );
        })}
      </Card>

      <Card padded={false} className="min-w-0 flex flex-col" style={{ height: '70vh' }}>
        <div
          className="px-5 py-3.5 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--color-divider)' }}
        >
          <span
            className="w-9 h-9 rounded-full text-white text-[13px] font-bold flex items-center justify-center"
            style={{ background: 'var(--color-primary)' }}
          >
            {initialsOf(active?.customer?.name ?? active?.customer_name)}
          </span>
          <div className="min-w-0">
            <div className="text-[14px] font-bold truncate">
              {active?.customer?.name ?? active?.customer_name ?? 'Customer'}
            </div>
            <div className="text-[11.5px] text-[var(--color-muted)] truncate">
              {active?.booking?.service?.name ?? 'Booking chat'}
            </div>
          </div>
        </div>

        <div ref={threadRef} className="kx-scroll flex-1 overflow-y-auto p-5 flex flex-col gap-2.5">
          {messages.map((message) => {
            const mine = isMine(message);
            return (
              <div
                key={message.id}
                className="max-w-[72%] px-3.5 py-2.5"
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  background: mine ? 'var(--color-primary)' : '#fff',
                  color: mine ? '#fff' : 'var(--color-ink)',
                  border: mine ? 'none' : '1px solid var(--color-line)',
                  borderRadius: mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                }}
              >
                <div className="text-[13px] leading-[1.55]">
                  {message.message_text ?? message.text}
                </div>
                <div
                  className="text-[10.5px] mt-1"
                  style={{ color: mine ? 'rgba(255,255,255,.7)' : 'var(--color-disabled)' }}
                >
                  {formatTime(message.createdAt ?? message.created_at)}
                </div>
              </div>
            );
          })}
        </div>

        <form
          onSubmit={send}
          className="p-3.5 flex items-center gap-2.5"
          style={{ borderTop: '1px solid var(--color-divider)' }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a message…"
            maxLength={4000}
            className="flex-1 rounded-[var(--radius-pill)] px-4 py-3 text-[13.5px] outline-none"
            style={{ background: 'var(--color-canvas)', border: '1px solid var(--color-line)' }}
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white cursor-pointer disabled:opacity-50"
            style={{ background: 'var(--color-primary)' }}
          >
            <Send size={16} />
          </button>
        </form>
      </Card>
    </div>
  );
}
