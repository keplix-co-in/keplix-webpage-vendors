'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usePortalHeader } from '../layout';
import { Card, CardHeader, EmptyState } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import StarRating from '@/components/ui/StarRating';
import { useToast } from '@/components/ui/Toast';
import { reviewsAPI } from '@/api/customers';
import { unwrap } from '@/lib/queries';
import { formatDate, initialsOf } from '@/lib/format';
import { formatRating, hasRating, NO_RATING_LABEL } from '@/shared/utils/rating';

export default function ReviewsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: async () => unwrap(await reviewsAPI.getVendorReviews(), 'reviews'),
  });

  const average = useMemo(() => {
    const rated = reviews.filter((r) => hasRating(r.rating));
    if (rated.length === 0) return null;
    return rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length;
  }, [reviews]);

  usePortalHeader(
    'Customer reviews',
    `${reviews.length} review${reviews.length === 1 ? '' : 's'} · reply to keep your rating healthy`
  );

  const distribution = useMemo(() => {
    const counts = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: reviews.filter((r) => Math.round(Number(r.rating)) === star).length,
    }));
    const total = reviews.length || 1;
    return counts.map((row) => ({ ...row, pct: Math.round((row.count / total) * 100) }));
  }, [reviews]);

  const publishReply = async (reviewId) => {
    if (!draft.trim()) return;
    setBusy(true);
    const result = await reviewsAPI.replyToReview(reviewId, draft.trim());
    setBusy(false);

    if (result?.success) {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      setReplyingTo(null);
      setDraft('');
      toast.success('Reply published');
    } else {
      toast.error(result?.error || 'Could not publish that reply');
    }
  };

  return (
    <div
      className="grid gap-6 items-start max-[880px]:grid-cols-[minmax(0,1fr)]"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)' }}
    >
      <div className="min-w-0">
        {isLoading ? (
          <Card>
            <div className="text-[13px] text-[var(--color-muted)]">Loading reviews…</div>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <EmptyState
              title="No reviews yet"
              body="Customers can review you once a job is complete. Their feedback shows up here."
            />
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="mb-4">
              <div className="flex items-start gap-3.5 mb-3">
                <span
                  className="w-10 h-10 rounded-full text-white text-[14px] font-bold flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {initialsOf(review.customer?.name ?? review.customer_name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate">
                    {review.customer?.name ?? review.customer_name ?? 'Customer'}
                  </div>
                  <div className="text-[12px] text-[var(--color-muted)] truncate">
                    {review.service?.name ?? review.service_name ?? 'Service'} ·{' '}
                    {formatDate(review.createdAt ?? review.created_at)}
                  </div>
                </div>
                <StarRating value={Number(review.rating) || 0} showValue />
              </div>

              {review.comment && (
                <p className="text-[13.5px] text-[var(--color-ink-body)] leading-[1.7] italic">
                  “{review.comment}”
                </p>
              )}

              {review.reply ? (
                <div
                  className="mt-4 rounded-[var(--radius-small)] p-3.5"
                  style={{ background: 'var(--color-primary-tint)' }}
                >
                  <div className="text-[11px] font-bold tracking-[.7px] text-[var(--color-primary-dark)] uppercase mb-1.5">
                    Your reply
                  </div>
                  <p className="text-[13px] text-[var(--color-ink-body)] leading-[1.6]">
                    {review.reply}
                  </p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-4">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Thank the customer, or explain what happened."
                    rows={3}
                  />
                  <div className="flex gap-2.5 mt-3">
                    <Button size="sm" loading={busy} onClick={() => publishReply(review.id)}>
                      Publish Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReplyingTo(null);
                        setDraft('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    size="sm"
                    variant="tint"
                    onClick={() => {
                      setReplyingTo(review.id);
                      setDraft('');
                    }}
                  >
                    Reply
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <Card className="min-w-0">
        <CardHeader title="Your rating" />
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[34px] font-bold tracking-[-1px] leading-none">
            {average === null ? NO_RATING_LABEL : formatRating(average)}
          </span>
          {average !== null && <StarRating value={average} size={16} />}
        </div>

        {distribution.map((row) => (
          <div key={row.star} className="flex items-center gap-3 mb-2">
            <span className="text-[12px] text-[var(--color-muted)] w-3">{row.star}</span>
            <span
              className="flex-1 h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--color-divider)' }}
            >
              <span
                className="block h-full rounded-full"
                style={{ width: `${row.pct}%`, background: 'var(--color-star-alt)' }}
              />
            </span>
            <span className="text-[12px] text-[var(--color-muted)] w-6 text-right">{row.count}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
