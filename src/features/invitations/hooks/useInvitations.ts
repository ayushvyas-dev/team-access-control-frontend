'use client';

import { useQuery } from '@tanstack/react-query';
import { getInvitations } from '@/lib/api/invitations';

export function useInvitations(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'invitations'],
    queryFn: async () => {
      const res = await getInvitations(orgId);
      return res.data;
    },
    enabled: !!orgId,
  });
}
