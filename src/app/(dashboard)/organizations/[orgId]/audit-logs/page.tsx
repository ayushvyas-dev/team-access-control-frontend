"use client";

import { useState } from "react";
import { useOrgContext } from "@/providers/OrgProvider";
import { useAuditLogs } from "@/features/audit-logs/hooks/useAuditLogs";
import { AuditLogTable } from "@/features/audit-logs/components/AuditLogTable";
import { AuditLogFilters } from "@/features/audit-logs/components/AuditLogFilters";
import { AuditLogPagination } from "@/features/audit-logs/components/AuditLogPagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText } from "lucide-react";
import type { AuditAction, AuditResourceType } from "@/types/api";

const PAGE_SIZE = 10;

export default function AuditLogsPage() {
  const { org } = useOrgContext();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState<AuditAction | undefined>();
  const [resourceType, setResourceType] = useState<
    AuditResourceType | undefined
  >();

  const { data, isLoading, error, refetch } = useAuditLogs(org.id, {
    page,
    limit: PAGE_SIZE,
    action,
    resourceType,
  });

  const logs = data?.data?.logs;
  const pagination = data?.data;

  const handleActionChange = (val: AuditAction | undefined) => {
    setAction(val);
    setPage(1);
  };

  const handleResourceTypeChange = (val: AuditResourceType | undefined) => {
    setResourceType(val);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Audit logs</h2>
        <p className="mt-0.5 text-sm leading-6 text-gray-500">
          Activity history for this organization
        </p>
      </div>

      <AuditLogFilters
        action={action}
        resourceType={resourceType}
        onActionChange={handleActionChange}
        onResourceTypeChange={handleResourceTypeChange}
      />

      {isLoading && (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <ErrorState
          message="Failed to load audit logs"
          retry={() => refetch()}
        />
      )}

      {logs && logs.length === 0 && (
        <EmptyState
          icon={ScrollText}
          title="No audit logs"
          description="No activity has been recorded yet for this organization."
        />
      )}

      {logs && logs.length > 0 && <AuditLogTable logs={logs} />}

      {pagination && (
        <AuditLogPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
