import { apiClient } from "@/lib/api-client";
import {
  ApiResponse,
  Invitation,
  PendingInvitationsResponse,
} from "@/types/api";

export async function getInvitations(orgId: string) {
  return apiClient<ApiResponse<Invitation[]>>(
    `/organizations/${orgId}/invitations`,
  );
}

export async function createInvitation(
  orgId: string,
  data: { email: string; role: string },
) {
  return apiClient<ApiResponse<Invitation>>(
    `/organizations/${orgId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

export async function deleteInvitation(orgId: string, invitationId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/organizations/${orgId}/invitations/${invitationId}`,
    {
      method: "DELETE",
    },
  );
}

export async function acceptInvitation(invitationId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/invitations/${invitationId}/accept`,
    {
      method: "POST",
    },
  );
}

export async function getPendingInvitations() {
  return apiClient<PendingInvitationsResponse>("/invitations");
}

export async function rejectInvitation(invitationId: string) {
  return apiClient<{ success: boolean; message: string }>(
    `/invitations/${invitationId}/reject`,
    {
      method: "POST",
    },
  );
}
