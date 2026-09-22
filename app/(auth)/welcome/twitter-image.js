import { renderSocialCard, socialCardAlt, socialCardSize } from '@/lib/socialCard';

// See opengraph-image.js in this folder: the layout's own `twitter` object
// replaces the inherited image, so the card is declared again at this level.
export const alt = socialCardAlt;
export const size = socialCardSize;
export const contentType = 'image/png';

export default function Image() {
  return renderSocialCard();
}
