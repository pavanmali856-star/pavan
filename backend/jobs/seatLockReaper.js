const Showtime = require('../models/Showtime');
const { releaseExpiredLocks, getLockTtlMs } = require('../utils/seatLocks');
const { getIO } = require('../socket');

function startSeatLockReaper() {
  const intervalMs = Math.max(5_000, Number(process.env.SEAT_REAPER_INTERVAL_MS) || 15_000);

  const timer = setInterval(async () => {
    try {
      const ttlMs = getLockTtlMs();
      const cutoff = new Date(Date.now() - ttlMs);

      const candidates = await Showtime.find({
        'seats.status': 'Locked',
        'seats.lockedAt': { $lte: cutoff },
      })
        .select('seats')
        .limit(50);

      for (const showtime of candidates) {
        const released = releaseExpiredLocks(showtime);
        if (!released.length) continue;
        await showtime.save();
        try {
          getIO()
            .to(`showtime:${showtime._id}`)
            .emit('seats:released', { showtimeId: String(showtime._id), seats: released });
        } catch (_) {}
      }
    } catch (_) {
      // keep running
    }
  }, intervalMs);

  return () => clearInterval(timer);
}

module.exports = { startSeatLockReaper };

