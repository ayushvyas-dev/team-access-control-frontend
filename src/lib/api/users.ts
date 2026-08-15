import { apiClient } from '@/lib/api-client';
import { ApiResponse, User } from '@/types/api';

export async function getMe() {
  return apiClient<ApiResponse<User>>('/users/me');
}

export async function updateMe(data: { name: string }) {
  return apiClient<ApiResponse<User>>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteMe() {
  return apiClient<{ success: boolean; message: string }>('/users/me', {
    method: 'DELETE',
  });
}
