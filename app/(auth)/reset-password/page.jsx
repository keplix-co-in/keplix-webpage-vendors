'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Circle } from 'lucide-react';
import AuthShell from '@/components/auth/AuthShell';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authAPI } from '@/api/auth';
import { checkPassword, isPasswordValid, PASSWORD_HINT } from '@/shared/utils/passwordRules';
import { stepStore, useStepValue } from '../_lib/stepStore';

export default function ResetPasswordPage() {
  const router = useRouter();
  const email = useStepValue('reset_email');
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (email === null) router.replace('/forgot-password');
  }, [email, router]);

  const rules = checkPassword(form.password);

  const submit = async (event) => {
    event.preventDefault();

    if (!isPasswordValid(form.password)) {
      setError('Your password does not meet all the requirements yet.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

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

    stepStore.clear('reset_email', 'reset_otp', 'phone');
    router.replace('/done');
  };

  return (
    <AuthShell title="Reset Password" subtitle={PASSWORD_HINT} backHref="/forgot-password/otp">
      <form onSubmit={submit} noValidate>
        <Input
          label="Enter your new password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-[18px]"
        />

        <ul className="mb-[18px] flex flex-col gap-1.5">
          {rules.map((rule) => (
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
          onChange={(e) => setForm({ ...form, confirm: e.target.value })}
          error={error}
          className="mb-[18px]"
        />

        <Button type="submit" fullWidth loading={busy}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
