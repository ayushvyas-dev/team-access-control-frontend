import { apiClient } from '@/lib/api-client';
import { ApiResponse, Invitation } from '@/types/api';

export async function getInvitations(orgId: string) {
  return apiClient<ApiResponse<Invitation[]>>(
    `/organizations/${orgId}/invitations`
  );
}

export async function createInvitation(
  orgId: string,
  data: { email: string; role: string }
) {
  return apiClient<ApiResponse<Invitation>>(
    `/organizations/${orgId}/invitations`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function deleteInvitation(orgId: string, invitationId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/organizations/${orgId}/invitations/${invitationId}`,
    {
      method: 'DELETE',
    }
  );
}

export async function acceptInvitation(token: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/invitations/${token}/accept`,
    {
      method: 'POST',
    }
  );
}

export async function rejectInvitation(token: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/invitations/${token}/reject`,
    {
      method: 'POST',
    }
  );
}
