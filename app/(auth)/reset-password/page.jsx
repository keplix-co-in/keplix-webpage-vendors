'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Circle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { PASSWORD_RULES, rules, rulePassword, validate } from '@/shared/utils/validation';
import { stepStore, useStepValue } from '../_lib/stepStore';

/** The single-line summary the design puts under the Reset Password title. */
const PASSWORD_HINT =
  'Password must contain 8 characters, including a number, an uppercase letter and a special character';

export default function ResetPasswordPage() {
  const router = useRouter();
  const email = useStepValue('reset_email');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (email === null) router.replace('/forgot-password');
  }, [email, router]);

  // The checklist shows which rule is still unmet, rather than one alert listing
  // everything at once the way the mobile screen does.
  const checklist = PASSWORD_RULES.map((rule) => ({
    ...rule,
    passed: rule.test(form.password),
  }));

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current));
    if (error) setError(null);
  };

  const submit = async (event) => {
    event.preventDefault();

    const { errors: found, isValid } = validate(form, {
      password: [rules.required('Password'), rulePassword],
      confirm: [
        rules.required('Password confirmation'),
        rules.matches(form.password, 'Passwords do not match'),
      ],
    });
    setErrors(found);
    if (!isValid) return;

    const otp = stepStore.get('reset_otp');
    if (!otp) {
      router.replace('/forgot-password');
      return;
    }

    setBusy(true);
    setError(null);

    const result = await authAPI.resetPasswordOTP(email, otp, form.password);
    setBusy(false);

    if (!result?.success) {
      // The same endpoint checks the code and sets the password, so an invalid
      // code surfaces here — send it back to the step that can fix it.
      const message = String(result?.error || '').toLowerCase();
      if (message.includes('otp') || message.includes('code')) {
        stepStore.set('reset_otp_invalid', '1');
        router.replace('/forgot-password/otp');
        return;
      }
      setError(result?.error || 'Failed to reset password. Please try again.');
      return;
    }

    stepStore.clear('reset_email', 'reset_otp');
    router.replace('/done');
  };

  return (
    <AuthShell title="Reset Password" subtitle={PASSWORD_HINT}>
      <form onSubmit={submit} noValidate>
        <Input
          label="Enter your new password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          className="mb-[18px]"
        />

        <ul className="mb-[18px] flex flex-col gap-1.5">
          {checklist.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center gap-2 text-[11.5px] font-semibold"
              style={{ color: rule.passed ? 'var(--color-success-dark)' : 'var(--color-disabled)' }}
            >
              {rule.passed ? <Check size={13} /> : <Circle size={13} />}
              {rule.label}
            </li>
          ))}
        </ul>

        <Input
          label="Confirm new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={update('confirm')}
          error={errors.confirm || error}
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Reset password
        </Button>
      </form>

      <p className="text-center text-[12.5px] text-[var(--color-muted)] mt-[18px]">
        <Link href="/sign-in" className="font-bold text-[var(--color-primary)]">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
