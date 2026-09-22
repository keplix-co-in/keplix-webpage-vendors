import { renderSocialCard, socialCardAlt, socialCardSize } from '@/lib/socialCard';

// Same card as opengraph-image.js. Next reads these config exports statically,
// so they are declared here rather than re-exported from that file.
export const alt = socialCardAlt;
export const size = socialCardSize;
export const contentType = 'image/png';

export default function Image() {
  return renderSocialCard();
}
