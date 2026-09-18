'use client';

import Image from 'next/image';

/**
 * The brand lockup used in every header — the same artwork the mobile app ships
 * (assets/images/white-icon-keplix.jpeg), in a rounded white frame.
 */
export default function BrandLockup({
  width = 98,
  height = 36,
  label = 'Partner portal',
  sublabel,
  onDark = false,
}) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className="rounded-[var(--radius-logo)] overflow-hidden bg-white shrink-0"
        style={{
          width,
          height,
          border: onDark ? '1px solid rgba(255,255,255,.18)' : '1px solid rgba(17,24,39,.08)',
        }}
      >
        <Image
          src="/assets/white-icon-keplix.jpeg"
          alt="Keplix"
          width={width}
          height={height}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      {label && (
        <div className="min-w-0">
          <div
            className="text-[15px] font-bold tracking-[-0.2px] whitespace-nowrap"
            style={{ color: onDark ? '#fff' : 'var(--color-ink)' }}
          >
            {label}
          </div>
          {sublabel && (
            <div
              className="text-[11px] whitespace-nowrap"
              style={{ color: onDark ? 'rgba(255,255,255,.75)' : 'var(--color-disabled)' }}
            >
              {sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
