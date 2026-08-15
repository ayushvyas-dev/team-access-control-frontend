'use client';

import { useOrgContext } from '@/providers/OrgProvider';
import { usePermission } from '@/hooks/usePermission';
import { OrgForm } from '@/features/organizations/components/OrgForm';
import { OrgDeleteDialog } from '@/features/organizations/components/OrgDeleteDialog';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';

export default function OrgDetailPage() {
  const { org, role } = useOrgContext();
  const canUpdate = usePermission('organization:update');
  const canDelete = usePermission('organization:delete');

  return (
    <div className="space-y-8">
      {/* Org Info */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Organization details
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Name</span>
            <p className="text-gray-900 font-medium mt-0.5">{org.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Slug</span>
            <p className="text-gray-900 font-mono text-xs mt-0.5">{org.slug}</p>
          </div>
          <div>
            <span className="text-gray-500">Your role</span>
            <p className="text-gray-900 font-medium mt-0.5">{role}</p>
          </div>
          <div>
            <span className="text-gray-500">Created</span>
            <p className="text-gray-900 mt-0.5">{formatDate(org.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Edit Org (OWNER only) */}
      {canUpdate && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Update organization
          </h2>
          <OrgForm orgId={org.id} currentName={org.name} />
        </div>
      )}

      {/* Danger Zone (OWNER only) */}
      {canDelete && (
        <>
          <Separator />
          <div className="border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-600 mb-2">
              Danger zone
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Permanently delete this organization and all of its data. This
              action cannot be undone.
            </p>
            <OrgDeleteDialog orgId={org.id} orgName={org.name} />
          </div>
        </>
      )}
    </div>
  );
}
