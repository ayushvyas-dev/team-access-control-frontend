'use client';

import { useMutation } from '@tanstack/react-query';
import { verifyEmail as verifyEmailApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useVerifyEmail() {
  const router = useRouter();

  return useMutation({
    mutationFn: verifyEmailApi,
    onSuccess: () => {
      toast.success('Email verified successfully! Please log in.');
      router.push('/login');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Verification failed');
    },
  });
}
