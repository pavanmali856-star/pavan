function createCache({ ttlMs = 30_000, max = 500 } = {}) {
  const store = new Map(); // key -> { value, expiresAt }

  function get(key) {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  function set(key, value, overrideTtlMs) {
    if (store.size >= max) {
      // Simple eviction: delete oldest
      const oldestKey = store.keys().next().value;
      if (oldestKey !== undefined) store.delete(oldestKey);
    }
    store.set(key, { value, expiresAt: Date.now() + (overrideTtlMs ?? ttlMs) });
  }

  function del(key) {
    store.delete(key);
  }

  function clear() {
    store.clear();
  }

  return { get, set, del, clear };
}

module.exports = { createCache };

