"use client";

import { useSearchParams } from "next/navigation";
import { OtpForm } from "@/features/auth/components/OtpForm";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  return (
    <div>
      <div className="mb-6 text-center sm:mb-7">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[1.75rem]">
          Verify your email
        </h1>
        <p className="mt-1 text-sm leading-6 text-gray-500">
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
