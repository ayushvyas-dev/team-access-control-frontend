'use client';

import { useMutation } from '@tanstack/react-query';
import { login as loginApi } from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useLogin() {
  const { setUser } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setUser({ id: data.user.id, email: data.user.email });
      toast.success('Logged in successfully');
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Login failed');
    },
  });
}
