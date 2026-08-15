'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rejectInvitation } from '@/lib/api/invitations';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => rejectInvitation(invitationId),
    onSuccess: () => {
      toast.success('Invitation rejected');
      queryClient.invalidateQueries({
        queryKey: ['invitations', 'pending'],
      });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to reject invitation');
    },
  });
}
