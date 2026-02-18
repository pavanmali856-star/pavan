import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import { useAuth } from '../state/auth';
import type { Booking, Movie } from '../types';
import { Button } from '../components/ui/Button';
import { MovieCard } from '../components/MovieCard';

export function ProfilePage() {
  const { user } = useAuth();

  const bookingsQuery = useQuery({
    queryKey: ['mybookings'],
    queryFn: async () => {
      const res = await api.get<Booking[]>('/bookings/mybookings');
      return res.data;
    },
  });

  const recsQuery = useQuery({
    queryKey: ['recommendations'],
    queryFn: async () => {
      const res = await api.get<{ items: Movie[] }>('/movies/recommendations');
      return res.data.items;
    },
  });

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-semibold">{user?.name}</div>
            <div className="text-xs text-zinc-400">{user?.email} • {user?.role}</div>
          </div>
          <Link to="/">
            <Button variant="secondary">Browse movies</Button>
          </Link>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="text-sm font-semibold">Booking history</div>
        <div className="mt-1 text-xs text-zinc-400">Confirmed bookings appear here after payment.</div>

        {bookingsQuery.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : bookingsQuery.isError ? (
          <div className="mt-4 text-sm text-rose-200">{getErrorMessage(bookingsQuery.error)}</div>
        ) : (
          <div className="mt-4 space-y-3">
            {(bookingsQuery.data || []).map((b) => (
              <div key={b._id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <div className="text-sm font-medium">{b.showtime?.movie?.title ?? 'Movie'}</div>
                    <div className="text-xs text-zinc-400">
                      {b.showtime?.theater?.name ?? ''} • {new Date(b.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-zinc-200">
                    <span className="text-zinc-400">Total</span> ₹{b.totalAmount} • <span className="text-zinc-400">Status</span> {b.status}
                  </div>
                </div>
                <div className="mt-2 text-xs text-zinc-300">
                  Seats: {b.seats.map((s) => `${s.row}${s.number}`).join(', ')}
                </div>
              </div>
            ))}
            {(bookingsQuery.data || []).length === 0 && (
              <div className="text-sm text-zinc-400">No bookings yet.</div>
            )}
          </div>
        )}
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="text-sm font-semibold">Recommended for you</div>
        <div className="mt-1 text-xs text-zinc-400">AI-lite content-based suggestions from your booking history.</div>

        {recsQuery.isLoading ? (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : recsQuery.isError ? (
          <div className="mt-4 text-sm text-rose-200">{getErrorMessage(recsQuery.error)}</div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {(recsQuery.data || []).slice(0, 8).map((m) => (
              <MovieCard key={m._id} movie={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

