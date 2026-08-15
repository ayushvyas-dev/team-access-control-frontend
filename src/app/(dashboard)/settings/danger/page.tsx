'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deleteMe } from '@/lib/api/users';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api-client';

export default function DangerPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { logout } = useAuth();

  const deleteMutation = useMutation({
    mutationFn: deleteMe,
    onSuccess: () => {
      toast.success('Account deleted');
      logout();
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
          Danger Zone
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Irreversible and destructive actions
        </p>
      </div>

      <div className="border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">
          Delete account
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50"
          onClick={() => setShowConfirm(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete my account
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Delete your account"
        description="This will permanently delete your account and all data. This action cannot be undone."
        confirmLabel="Delete account"
        onConfirm={() => deleteMutation.mutate()}
        destructive
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
