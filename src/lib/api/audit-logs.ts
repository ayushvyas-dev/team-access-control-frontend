import { apiClient } from '@/lib/api-client';
import { AuditLog, AuditAction, AuditResourceType } from '@/types/api';

export type AuditLogsQuery = {
  page?: number;
  limit?: number;
  action?: AuditAction;
  actorId?: string;
  resourceType?: AuditResourceType;
};

export type AuditLogsResponse = {
  success: boolean;
  message: string;
  data: {
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function getAuditLogs(orgId: string, query?: AuditLogsQuery) {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.action) params.set('action', query.action);
  if (query?.actorId) params.set('actorId', query.actorId);
  if (query?.resourceType) params.set('resourceType', query.resourceType);

  const qs = params.toString();
  const path = `/organizations/${orgId}/audit-logs${qs ? `?${qs}` : ''}`;
  return apiClient<AuditLogsResponse>(path);
}

