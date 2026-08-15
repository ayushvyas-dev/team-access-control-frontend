'use client';

import { useQuery } from '@tanstack/react-query';
import { getMembers } from '@/lib/api/members';

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: async () => {
      const res = await getMembers(orgId);
      return res.data.memberships;
    },
    enabled: !!orgId,
  });
}
