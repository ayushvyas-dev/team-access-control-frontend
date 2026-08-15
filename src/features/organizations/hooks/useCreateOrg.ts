'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrganization } from '@/lib/api/organizations';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export function useCreateOrg() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      toast.success('Organization created');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to create organization');
    },
  });
}
