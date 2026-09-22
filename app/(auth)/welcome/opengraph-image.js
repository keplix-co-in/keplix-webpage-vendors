import { renderSocialCard, socialCardAlt, socialCardSize } from '@/lib/socialCard';

// Needed here as well as at app/: this segment's layout declares its own
// `openGraph` object, which replaces the one inherited from the root — image
// included. A file at this segment level takes precedence over that object.
export const alt = socialCardAlt;
export const size = socialCardSize;
export const contentType = 'image/png';

export default function Image() {
  return renderSocialCard();
}
