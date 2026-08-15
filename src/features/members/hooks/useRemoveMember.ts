'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeMember, leaveOrganization } from '@/lib/api/members';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ApiError } from '@/lib/api-client';

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) => removeMember(orgId, memberId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to remove member');
    },
  });
}

export function useLeaveOrg(orgId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => leaveOrganization(orgId),
    onSuccess: () => {
      toast.success('You left the organization');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to leave organization');
    },
  });
}
