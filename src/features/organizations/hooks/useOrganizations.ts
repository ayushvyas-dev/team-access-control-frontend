'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '@/lib/api/organizations';

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const res = await getOrganizations();
      return res.data;
    },
  });
}
