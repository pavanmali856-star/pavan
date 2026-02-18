const DEFAULT_LOCK_TTL_MS = 5 * 60 * 1000;

function getLockTtlMs() {
  const raw = process.env.SEAT_LOCK_TTL_MS;
  const n = Number(raw);
  if (!raw) return DEFAULT_LOCK_TTL_MS;
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LOCK_TTL_MS;
  return n;
}

function isLockExpired(lockedAt) {
  if (!lockedAt) return true;
  const ttl = getLockTtlMs();
  return Date.now() - new Date(lockedAt).getTime() > ttl;
}

/**
 * Mutates showtime.seats in-place to release expired locks.
 * Returns the list of seats that changed.
 */
function releaseExpiredLocks(showtime) {
  if (!showtime || !Array.isArray(showtime.seats)) return [];

  const changed = [];
  for (const seat of showtime.seats) {
    if (seat.status !== 'Locked') continue;
    if (!isLockExpired(seat.lockedAt)) continue;

    seat.status = 'Available';
    seat.user = null;
    seat.lockedAt = null;
    changed.push({ row: seat.row, number: seat.number });
  }
  return changed;
}

module.exports = {
  getLockTtlMs,
  isLockExpired,
  releaseExpiredLocks,
};

