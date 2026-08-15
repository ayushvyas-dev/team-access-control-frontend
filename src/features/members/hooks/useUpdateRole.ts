'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateMemberRole } from '@/lib/api/members';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useUpdateRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(orgId, memberId, { role }),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to update role');
    },
  });
}
