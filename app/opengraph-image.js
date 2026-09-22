import { renderSocialCard, socialCardAlt, socialCardSize } from '@/lib/socialCard';

// Root-level, so every page that can be shared gets the branded card. Private
// routes are noindex anyway; this only affects link previews.
export const alt = socialCardAlt;
export const size = socialCardSize;
export const contentType = 'image/png';

export default function Image() {
  return renderSocialCard();
}
