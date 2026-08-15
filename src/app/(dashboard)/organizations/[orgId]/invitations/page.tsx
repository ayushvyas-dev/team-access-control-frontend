'use client';

import { useOrgContext } from '@/providers/OrgProvider';
import { useInvitations } from '@/features/invitations/hooks/useInvitations';
import { InviteForm } from '@/features/invitations/components/InviteForm';
import { InvitationTable } from '@/features/invitations/components/InvitationTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Mail } from 'lucide-react';

export default function InvitationsPage() {
  const { org } = useOrgContext();
  const { data: invitations, isLoading, error, refetch } = useInvitations(org.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Invitations</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Invite people to join your organization
        </p>
      </div>

      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Send invitation
        </h3>
        <InviteForm orgId={org.id} />
      </div>

      <Separator />

      <div>
        <h3 className="text-base font-medium text-gray-900 mb-4">
          Pending invitations
        </h3>

        {isLoading && (
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-16" />
                <div className="flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <ErrorState
            message="Failed to load invitations"
            retry={() => refetch()}
          />
        )}

        {invitations && invitations.length === 0 && (
          <EmptyState
            icon={Mail}
            title="No pending invitations"
            description="Send an invitation above to start adding team members."
          />
        )}

        {invitations && invitations.length > 0 && (
          <InvitationTable invitations={invitations} orgId={org.id} />
        )}
      </div>
    </div>
  );
}
