'use client';

import { useQuery } from '@tanstack/react-query';
import { getSessions } from '@/lib/api/sessions';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await getSessions();
      return res.data;
    },
  });
}
