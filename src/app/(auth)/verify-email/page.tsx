'use client';

import { useSearchParams } from 'next/navigation';
import { OtpForm } from '@/features/auth/components/OtpForm';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Verify your email
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          We sent a verification code to your email
        </p>
      </div>
      <OtpForm defaultEmail={email} />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
