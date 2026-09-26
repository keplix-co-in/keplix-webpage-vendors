/**
 * Sink for Content-Security-Policy-Report-Only violation reports.
 *
 * WHY: the policy in next.config.mjs is report-only until real flows prove it
 * clean, but without an endpoint the reports went nowhere except the console of
 * whoever happened to be testing. This logs them to the Vercel function logs so
 * the "clean for a week" precondition for enforcing it can actually be checked.
 *
 * Accepts both report formats: legacy `report-uri` (application/csp-report) and
 * the Reporting API (application/reports+json). Only a few whitelisted fields
 * are logged, truncated — the body is attacker-controllable, so it is never
 * echoed back or logged wholesale. Always answers 204.
 */

const MAX_BODY = 8 * 1024;
const clip = (v) => (typeof v === 'string' ? v.slice(0, 200) : undefined);

const pick = (r) => ({
  directive: clip(r['effective-directive'] ?? r.effectiveDirective ?? r['violated-directive']),
  blocked: clip(r['blocked-uri'] ?? r.blockedURL),
  document: clip(r['document-uri'] ?? r.documentURL),
  source: clip(r['source-file'] ?? r.sourceFile),
  line: Number.isInteger(r['line-number'] ?? r.lineNumber) ? (r['line-number'] ?? r.lineNumber) : undefined,
});

export async function POST(request) {
  // Refuse oversized bodies before reading them: the endpoint is unauthenticated,
  // so buffering an arbitrary body first would let anyone burn function time.
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_BODY) return new Response(null, { status: 204 });

  try {
    const text = await request.text();
    if (text.length <= MAX_BODY) {
      const json = JSON.parse(text);
      const reports = Array.isArray(json) ? json.map((r) => r?.body) : [json['csp-report']];
      for (const r of reports.slice(0, 5)) {
        if (r && typeof r === 'object') console.warn('[csp-report]', JSON.stringify(pick(r)));
      }
    }
  } catch {
    // Malformed report — nothing useful to do with it.
  }
  return new Response(null, { status: 204 });
}
