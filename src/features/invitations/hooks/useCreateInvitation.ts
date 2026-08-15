'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvitation } from '@/lib/api/invitations';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useCreateInvitation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { email: string; role: string }) =>
      createInvitation(orgId, data),
    onSuccess: () => {
      toast.success('Invitation sent');
      queryClient.invalidateQueries({
        queryKey: ['organizations', orgId, 'invitations'],
      });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to send invitation');
    },
  });
}
