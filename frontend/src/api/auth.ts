import { apiFetch } from './client';
import type { User } from '../types/user';

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  accessTokenExpiresAt: string;
};

export async function login(payload: LoginRequest) {
  return apiFetch<LoginResponse, LoginRequest>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function fetchMe() {
  return apiFetch<User>('/auth/me');
}

export async function refreshToken() {
  return apiFetch<{ accessTokenExpiresAt: string }>('/auth/refresh', {
    method: 'POST',
  });
}

export async function logout() {
  try {
    await apiFetch<void>('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.warn('Logout failed', error);
  }
}
