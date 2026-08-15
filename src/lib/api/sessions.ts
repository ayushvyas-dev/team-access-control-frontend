import { apiClient } from '@/lib/api-client';
import { ApiResponse, Session } from '@/types/api';

export async function getSessions() {
  return apiClient<ApiResponse<Session[]>>('/sessions');
}

export async function revokeSession(sessionId: string) {
  return apiClient<{ success: boolean; message: string }>(`/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

export async function revokeAllSessions() {
  return apiClient<{ success: boolean; message: string }>('/sessions', {
    method: 'DELETE',
  });
}
