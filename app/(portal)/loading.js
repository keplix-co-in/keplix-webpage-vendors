/**
 * Shown inside the portal shell while a page's code loads, so the nav and
 * header stay put during navigation instead of the whole screen blanking.
 *
 * Wording and styling match the portal layout's own auth-restore state.
 */
export default function PortalLoading() {
  return (
    <div className="py-16 grid place-items-center text-[13px] text-[var(--color-muted)]">
      Loading…
    </div>
  );
}
