'use client';

import { useMutation } from '@tanstack/react-query';
import { register as registerApi } from '@/lib/api/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useRegister() {
  const router = useRouter();

  return useMutation({
    mutationFn: registerApi,
    onSuccess: (_data, variables) => {
      toast.success('Account created! Please verify your email.');
      router.push(`/verify-email?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}
