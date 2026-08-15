'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acceptInvitation } from '@/lib/api/invitations';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation accepted');
      queryClient.invalidateQueries({
        queryKey: ['invitations', 'pending'],
      });
      queryClient.invalidateQueries({
        queryKey: ['organizations'],
      });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to accept invitation');
    },
  });
}
