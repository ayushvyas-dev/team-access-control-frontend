'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getAuditLogs, AuditLogsQuery } from '@/lib/api/audit-logs';

export function useAuditLogs(orgId: string, query?: AuditLogsQuery) {
  return useQuery({
    queryKey: ['organizations', orgId, 'audit-logs', query],
    queryFn: () => getAuditLogs(orgId, query),
    enabled: !!orgId,
    placeholderData: keepPreviousData,
  });
}
