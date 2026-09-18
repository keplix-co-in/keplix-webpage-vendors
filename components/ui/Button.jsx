'use client';

// Button geometry comes straight from the handoff: every button is a pill,
// primary is brand purple, outline is a white pill with a 1px grey border, and
// the disabled state is #E5E7EB on #9CA3AF (see the Register Workshop button).

const VARIANTS = {
  primary: 'bg-[var(--color-primary)] text-white border border-[var(--color-primary)]',
  outline: 'bg-white text-[var(--color-ink-body)] border border-[var(--color-line-strong)]',
  google: 'bg-white text-[var(--color-ink-secondary)] border-[1.5px] border-[var(--color-line-strong)]',
  danger: 'bg-[var(--color-danger)] text-white border border-[var(--color-danger)]',
  teal: 'bg-[var(--color-teal)] text-white border border-[var(--color-teal)]',
  tint: 'bg-[var(--color-primary-tint)] text-[var(--color-primary-dark)] border border-[var(--color-primary-tint-border)]',
  ghost: 'bg-transparent text-[var(--color-primary)] border border-transparent',
};

const SIZES = {
  lg: 'px-6 py-4 text-[15px]',
  md: 'px-5 py-3 text-[13.5px]',
  sm: 'px-4 py-2 text-[12.5px]',
};

export default function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={[
        'rounded-[var(--radius-pill)] font-bold transition-opacity inline-flex items-center justify-center gap-2.5',
        SIZES[size],
        isDisabled
          ? 'bg-[var(--color-line)] text-[var(--color-disabled)] border border-[var(--color-line)] cursor-not-allowed'
          : `${VARIANTS[variant]} cursor-pointer hover:opacity-90`,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
