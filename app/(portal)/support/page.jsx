'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Mail, MessageCircle } from 'lucide-react';
import { usePortalHeader } from '../layout';
import { Card, CardHeader } from '@/components/ui/Card';
import { FAQS } from '@/shared/constants/faqs';

export default function SupportPage() {
  const [openId, setOpenId] = useState(FAQS[0]?.id ?? null);
  usePortalHeader('Support & FAQs', 'Answers and a direct line to the partner team');

  return (
    <div
      className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
    >
      <Card padded={false} className="min-w-0">
        <div className="px-[22px] pt-[22px] pb-1">
          <CardHeader title="Frequently asked questions" />
        </div>

        {FAQS.map((faq) => {
          const open = openId === faq.id;
          return (
            <div key={faq.id} style={{ borderTop: '1px solid var(--color-divider)' }}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : faq.id)}
                aria-expanded={open}
                className="w-full text-left px-[22px] py-4 flex items-center gap-4 cursor-pointer"
              >
                <span className="flex-1 text-[13.5px] font-bold">{faq.question}</span>
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform"
                  style={{
                    border: '1px solid #005A9C',
                    color: '#005A9C',
                    transform: open ? 'rotate(180deg)' : 'none',
                  }}
                >
                  <ChevronDown size={14} />
                </span>
              </button>
              {open && (
                <p className="px-[22px] pb-4 text-[13px] text-[var(--color-muted)] leading-[1.7]">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </Card>

      <Card className="min-w-0">
        <CardHeader title="Still need help?" />
        <Link
          href="/support/chat"
          className="flex items-center gap-3 rounded-[var(--radius-small)] px-4 py-3.5 mb-3"
          style={{ background: 'var(--color-primary-tint)' }}
        >
          <MessageCircle size={16} color="var(--color-primary)" />
          <span className="text-[13.5px] font-bold text-[var(--color-primary-dark)]">
            Chat with Keplix support
          </span>
        </Link>

        <a
          href="mailto:support@keplix.co.in"
          className="flex items-center gap-3 rounded-[var(--radius-small)] px-4 py-3.5"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <Mail size={16} color="var(--color-ink-body)" />
          <span className="text-[13.5px] font-bold text-[var(--color-ink-body)]">
            support@keplix.co.in
          </span>
        </a>
      </Card>
    </div>
  );
}
