import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';

type Stats = {
  totalUsers: number;
  totalMovies: number;
  totalTheaters: number;
  totalBookings: number;
  totalRevenue: number;
};

type Revenue = { items: { date: string; revenue: number; bookings: number }[] };

export function AdminDashboardPage() {
  const statsQ = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => (await api.get<Stats>('/admin/stats')).data,
  });
  const revenueQ = useQuery({
    queryKey: ['adminRevenue'],
    queryFn: async () => (await api.get<Revenue>('/admin/revenue')).data,
  });
  const topMoviesQ = useQuery({
    queryKey: ['adminTopMovies'],
    queryFn: async () => (await api.get<{ items: any[] }>('/admin/top-movies')).data.items,
  });

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-semibold">Admin control tower</div>
            <div className="mt-1 text-xs text-zinc-400">Analytics + management endpoints (microservices-ready module boundaries).</div>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/movies">
              <Button variant="secondary">Manage movies</Button>
            </Link>
            <Link to="/admin/theaters">
              <Button>Manage theaters</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard title="Users" value={statsQ.data?.totalUsers} />
        <StatCard title="Movies" value={statsQ.data?.totalMovies} />
        <StatCard title="Theaters" value={statsQ.data?.totalTheaters} />
        <StatCard title="Bookings" value={statsQ.data?.totalBookings} />
        <StatCard title="Revenue" value={statsQ.data ? `₹${statsQ.data.totalRevenue}` : undefined} accent />
      </section>

      {(statsQ.isError || revenueQ.isError || topMoviesQ.isError) && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
          {getErrorMessage(statsQ.error ?? revenueQ.error ?? topMoviesQ.error)}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <div className="text-sm font-semibold">Revenue (last 30 days)</div>
          <div className="mt-4 space-y-2">
            {(revenueQ.data?.items || []).slice(-10).map((r) => (
              <div key={r.date} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs text-zinc-300">{r.date}</div>
                <div className="text-xs text-zinc-400">{r.bookings} bookings</div>
                <div className="text-sm text-neon-500">₹{r.revenue}</div>
              </div>
            ))}
            {(revenueQ.data?.items || []).length === 0 && <div className="text-sm text-zinc-400">No revenue yet.</div>}
          </div>
        </div>

        <div className="glass rounded-3xl p-6">
          <div className="text-sm font-semibold">Top movies</div>
          <div className="mt-4 space-y-2">
            {(topMoviesQ.data || []).map((m) => (
              <div key={m.movieId} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <img src={m.posterUrl} className="h-12 w-10 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-zinc-400">
                    {m.bookings} bookings • {m.seats} seats
                  </div>
                </div>
                <div className="text-sm text-neon-500">₹{m.revenue}</div>
              </div>
            ))}
            {(topMoviesQ.data || []).length === 0 && <div className="text-sm text-zinc-400">No data yet.</div>}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string | number | undefined;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-3xl p-5">
      <div className="text-xs text-zinc-400">{title}</div>
      <div className={`mt-2 text-xl font-semibold ${accent ? 'text-neon-500' : ''}`}>{value ?? '—'}</div>
    </div>
  );
}

