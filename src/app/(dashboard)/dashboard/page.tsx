'use client';

import { useOrganizations } from '@/features/organizations/hooks/useOrganizations';
import { OrgCard } from '@/features/organizations/components/OrgCard';
import { CreateOrgDialog } from '@/features/organizations/components/CreateOrgDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

export default function DashboardPage() {
  const { data: orgs, isLoading, error, refetch } = useOrganizations();

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            Organizations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your organizations and teams
          </p>
        </div>
        <CreateOrgDialog />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-6">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-3 w-20 mb-4" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          message="Failed to load organizations"
          retry={() => refetch()}
        />
      )}

      {orgs && orgs.length === 0 && (
        <EmptyState
          icon={Building2}
          title="No organizations yet"
          description="Create your first organization to start collaborating with your team."
        />
      )}

      {orgs && orgs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <OrgCard key={org.id} org={org} />
          ))}
        </div>
      )}
    </div>
  );
}
