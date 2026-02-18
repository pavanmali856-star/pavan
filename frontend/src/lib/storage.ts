export function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

export function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

