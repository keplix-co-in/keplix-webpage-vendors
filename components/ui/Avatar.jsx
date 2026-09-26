'use client';

import { useState } from 'react';
import { initialsOf } from '@/lib/format';

/**
 * Round picture with an initial as fallback.
 *
 * Falls back both when there is no image and when it fails to load (a deleted
 * Cloudinary asset, an offline browser) — a broken-image icon in the header is
 * worse than the initial it replaces. A plain <img> is used on purpose: the
 * URLs are Cloudinary's and change per upload, so next/image would need a
 * remotePatterns entry for no benefit at this size.
 */
export default function Avatar({ src, name, size = 28, className = '' }) {
  // Remember which URL failed, so a new upload gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState(null);
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full text-white font-bold ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.43),
        background: 'var(--color-primary)',
      }}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}
