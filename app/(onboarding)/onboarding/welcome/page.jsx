'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import BrandLockup from '@/components/shell/BrandLockup';

const CHECKLIST = ['PAN Number', 'GSTIN Number', 'Trade Licence', 'Bank IFSC and Account Number'];

export default function OnboardingWelcomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--color-canvas)' }}>
      <div className="max-w-[1120px] mx-auto px-7 py-6 flex items-center justify-between gap-4 flex-wrap">
        <BrandLockup label="Partner portal" />
        <Link
          href="/sign-in"
          className="whitespace-nowrap bg-white text-[var(--color-ink-body)] text-[12.5px] font-bold rounded-[var(--radius-pill)] px-[18px] py-[9px]"
          style={{ border: '1px solid var(--color-line)' }}
        >
          Save &amp; exit
        </Link>
      </div>

      <div className="max-w-[1120px] mx-auto px-7 pt-1 pb-[70px]">
        <div
          className="bg-white rounded-[var(--radius-auth)] p-[34px] max-[880px]:p-6"
          style={{ border: '1px solid var(--color-line)' }}
        >
          <h1 className="text-[34px] font-bold tracking-[-0.9px] leading-[1.15] max-w-[420px]">
            Let&apos;s start our onboarding process!
          </h1>

          <div className="relative my-[30px] mb-7 max-w-[520px]">
            <div
              className="bg-white p-7 pb-[34px] rounded-[18px]"
              style={{ border: '1px solid var(--color-disabled)', borderTopRightRadius: 0 }}
            >
              {/* Folded corner from the design. */}
              <div
                className="absolute top-0 right-0 w-0 h-0"
                style={{
                  borderLeft: '40px solid transparent',
                  borderBottom: '40px solid var(--color-line)',
                }}
              />
              <div className="text-[16px] font-bold mb-[3px]">For an easy form filling process,</div>
              <div className="text-[13px] text-[var(--color-muted)] mb-[18px]">
                you can keep the following handy
              </div>
              <div className="h-px mb-5" style={{ background: 'var(--color-line-strong)' }} />

              {CHECKLIST.map((item) => (
                <div key={item} className="flex items-center gap-4 mb-4">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: 'var(--color-primary)' }}
                  />
                  <span className="text-[16px] font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href="/onboarding">
            <Button>Let&apos;s begin</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
