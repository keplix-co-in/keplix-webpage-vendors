/**
 * Web app manifest: gives "Add to Home Screen" on a workshop's phone or tablet
 * a proper name, icon and colour instead of a generic browser shortcut. Starts
 * at `/` so the entry router sends a signed-in vendor straight to their
 * dashboard (or unfinished onboarding step).
 */
export default function manifest() {
  return {
    name: 'Keplix Partner',
    short_name: 'Keplix Partner',
    description: 'Manage bookings, walk-ins, services and earnings for your Keplix workshop.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    // --color-primary in app/globals.css
    theme_color: '#4e46b4',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  };
}
