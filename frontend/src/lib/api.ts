import axios from 'axios';
import { safeGet } from './storage';

export const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = safeGet('pm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type ApiErrorShape = { message?: string };

export function getErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as ApiErrorShape | undefined)?.message ?? err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}

