import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * The 1200×630 share card used for both og:image and twitter:image, so a link
 * to partner.keplix.co.in shows a branded preview in WhatsApp, LinkedIn and X
 * instead of a blank box. Colours are the portal's design tokens from
 * app/globals.css (--color-primary, --color-ink).
 */
export const socialCardSize = { width: 1200, height: 630 };
export const socialCardAlt = 'Keplix Partner — workshop and garage management portal';

export async function renderSocialCard() {
  const logo = await readFile(join(process.cwd(), 'public/assets/keplix-icon.png'));
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #111827 0%, #3e3792 100%)',
          color: '#ffffff',
        }}
      >
        {/* Source PNG is 526×303; keep that ratio. ImageResponse (Satori)
            only renders plain <img>; next/image does not work here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={263} height={152} alt="" style={{ borderRadius: 16 }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1 }}>Keplix Partner</div>
          <div style={{ fontSize: 36, marginTop: 20, color: '#dedbf3' }}>
            Bookings, walk-ins, job cards and earnings for your workshop
          </div>
        </div>
        <div style={{ fontSize: 28, color: '#8f87da' }}>partner.keplix.co.in</div>
      </div>
    ),
    socialCardSize,
  );
}
