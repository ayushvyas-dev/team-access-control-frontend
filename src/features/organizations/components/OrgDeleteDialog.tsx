'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteOrganization } from '@/lib/api/organizations';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { ApiError } from '@/lib/api-client';

interface OrgDeleteDialogProps {
  orgId: string;
  orgName: string;
}

export function OrgDeleteDialog({ orgId, orgName }: OrgDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(orgId),
    onSuccess: () => {
      toast.success('Organization deleted');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      router.push('/dashboard');
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete organization');
    },
  });

  return (
    <>
      <Button
        variant="outline"
        className="text-red-600 border-red-200 hover:bg-red-50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete organization
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete organization"
        description={`Are you sure you want to delete "${orgName}"? This action cannot be undone. All members will lose access.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        destructive
        loading={deleteMutation.isPending}
      />
    </>
  );
}
