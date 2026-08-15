import { apiClient } from '@/lib/api-client';
import { ApiResponse, Membership } from '@/types/api';

export async function getMembers(orgId: string) {
  return apiClient<ApiResponse<{ memberships: Membership[] }>>(
    `/organizations/${orgId}/members`
  );
}

export async function getMember(orgId: string, memberId: string) {
  return apiClient<ApiResponse<{ membership: Membership }>>(
    `/organizations/${orgId}/members/${memberId}`
  );
}

export async function updateMemberRole(
  orgId: string,
  memberId: string,
  data: { role: string }
) {
  return apiClient<ApiResponse<{ membership: { role: string } }>>(
    `/organizations/${orgId}/members/${memberId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
}

export async function removeMember(orgId: string, memberId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/organizations/${orgId}/members/${memberId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function leaveOrganization(orgId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/organizations/${orgId}/members/me`,
    {
      method: 'DELETE',
    }
  );
}
