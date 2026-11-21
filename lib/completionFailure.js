/**
 * What the completion page should do with a failed "mark completed" request.
 * Pure (no React), so node:test can cover the branch order.
 *
 * Review fix (2026-11-21): pulled out of app/(portal)/bookings/[id]/completion
 * so the order is tested: BILL_NOT_ISSUED is also a 409, and the page's old
 * catch-all "any 409 = health sheet missing" would send a pricing v2 booking
 * to the health sheet and back in a loop. Backend order
 * (controllers/vendor/bookingController.js): health-sheet gate first, then the
 * bill gate, so a v2 booking can see both, one after the other.
 *
 * @param {{ status?: number, code?: string, details?: { code?: string } } | null | undefined} result
 * @returns {'bill_not_issued' | 'health_sheet' | 'error'}
 */
export const completionFailureKind = (result) => {
  const code = result?.code ?? result?.details?.code;
  if (code === 'BILL_NOT_ISSUED') return 'bill_not_issued';
  if (code === 'HEALTH_SHEET_REQUIRED' || result?.status === 409) return 'health_sheet';
  return 'error';
};

// The vendor app's store name is "Keplix - Garage Partner" (keplix-frontend
// app.config.js); bills can only be issued there, the web has no bill screens.
export const BILL_NOT_ISSUED_MESSAGE =
  'This booking uses itemised billing. Issue the final bill in the Keplix Garage Partner app first, then mark it completed here.';
