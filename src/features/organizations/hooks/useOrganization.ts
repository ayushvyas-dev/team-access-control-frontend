'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '@/lib/api/organizations';

export function useOrganization(orgId: string) {
  return useQuery({
    queryKey: ['organizations', orgId],
    queryFn: async () => {
      const res = await getOrganization(orgId);
      return res.data;
    },
    enabled: !!orgId,
  });
}
