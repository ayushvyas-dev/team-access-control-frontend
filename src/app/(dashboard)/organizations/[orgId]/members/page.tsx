'use client';

import { useState } from 'react';
import { useOrgContext } from '@/providers/OrgProvider';
import { useMembers } from '@/features/members/hooks/useMembers';
import { useLeaveOrg } from '@/features/members/hooks/useRemoveMember';
import { MemberTable } from '@/features/members/components/MemberTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, LogOut } from 'lucide-react';

export default function MembersPage() {
  const { org } = useOrgContext();
  const { data: members, isLoading, error, refetch } = useMembers(org.id);
  const [showLeave, setShowLeave] = useState(false);
  const leaveOrg = useLeaveOrg(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage who has access to this organization
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowLeave(true)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave organization
        </Button>
      </div>

      {isLoading && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          message="Failed to load members"
          retry={() => refetch()}
        />
      )}

      {members && members.length === 0 && (
        <EmptyState
          icon={Users}
          title="No members"
          description="This organization has no members."
        />
      )}

      {members && members.length > 0 && (
        <MemberTable members={members} orgId={org.id} />
      )}

      <ConfirmDialog
        open={showLeave}
        onOpenChange={setShowLeave}
        title="Leave organization"
        description={`Are you sure you want to leave "${org.name}"? You will lose access to this organization.`}
        confirmLabel="Leave"
        onConfirm={() => leaveOrg.mutate()}
        destructive
        loading={leaveOrg.isPending}
      />
    </div>
  );
}
