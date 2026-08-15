'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { revokeSession, revokeAllSessions } from '@/lib/api/sessions';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeSession,
    onSuccess: () => {
      toast.success('Session revoked');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to revoke session');
    },
  });
}

export function useRevokeAllSessions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeAllSessions,
    onSuccess: () => {
      toast.success('All sessions revoked');
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to revoke sessions');
    },
  });
}
