import { apiClient } from '@/lib/api-client';
import { ApiResponse, User } from '@/types/api';

export async function register(data: { name: string; email: string; password: string }) {
  return apiClient<ApiResponse<{ name: string; email: string }>>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function verifyEmail(data: { email: string; otp: string }) {
  return apiClient<ApiResponse<null>>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(data),
    skipAuth: true,
  });
}

export async function login(data: { email: string; password: string }) {
  return apiClient<{ success: boolean; message: string; user: { id: string; email: string } }>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify(data),
      skipAuth: true,
    }
  );
}

export async function refresh() {
  return apiClient<{ success: boolean; message: string }>('/auth/refresh', {
    method: 'POST',
    skipAuth: true,
  });
}
