import { apiClient } from '@/lib/api-client';
import { ApiResponse, Organization } from '@/types/api';

export async function getOrganizations() {
  return apiClient<ApiResponse<Organization[]>>('/organizations');
}

export async function getOrganization(orgId: string) {
  return apiClient<ApiResponse<Organization>>(`/organizations/${orgId}`);
}

export async function createOrganization(data: { name: string }) {
  return apiClient<ApiResponse<Organization>>('/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrganization(orgId: string, data: { name: string }) {
  return apiClient<ApiResponse<Organization>>(`/organizations/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteOrganization(orgId: string) {
  return apiClient<{ success: boolean; message: string }>(`/organizations/${orgId}`, {
    method: 'DELETE',
  });
}
