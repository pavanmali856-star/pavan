import { io, type Socket } from 'socket.io-client';
import { API_URL } from './api';

function defaultSocketUrl() {
  // If API_URL is relative (e.g. "/api"), fall back to current origin.
  if (API_URL.startsWith('/')) return window.location.origin;
  try {
    const u = new URL(API_URL);
    u.pathname = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return window.location.origin;
  }
}

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  const url = import.meta.env.VITE_SOCKET_URL ?? defaultSocketUrl();
  socket = io(url, { transports: ['websocket'] });
  return socket;
}

