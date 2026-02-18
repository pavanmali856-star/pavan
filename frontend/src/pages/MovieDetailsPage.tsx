import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import type { Movie } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../state/auth';

type ShowtimeListItem = {
  _id: string;
  startTime: string;
  price: number;
  theater: { _id: string; name: string };
  screen: { _id: string; name: string };
};

export function MovieDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const movieQuery = useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const res = await api.get<Movie>(`/movies/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });

  const showtimesQuery = useQuery({
    queryKey: ['showtimes', { movieId: id }],
    queryFn: async () => {
      const res = await api.get<ShowtimeListItem[]>('/showtimes', { params: { movie: id } });
      return res.data;
    },
    enabled: Boolean(id),
  });

  const m = movieQuery.data;

  if (movieQuery.isError) {
    return <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">{getErrorMessage(movieQuery.error)}</div>;
  }

  if (movieQuery.isLoading || !m) {
    return <div className="glass h-[420px] animate-pulse rounded-3xl" />;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 md:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <img src={m.posterUrl} className="aspect-[2/3] w-full object-cover" />
        </div>
        <div className="glass rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-semibold">{m.title}</div>
              <div className="mt-1 text-sm text-zinc-400">{m.duration} min • {new Date(m.releaseDate).getFullYear()}</div>
            </div>
            <div className="flex gap-2">
              {(m.language || []).map((l) => (
                <Badge key={l}>{l}</Badge>
              ))}
              <Badge>⭐ {m.rating?.toFixed?.(1) ?? m.rating}</Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {(m.genre || []).map((g) => (
              <Badge key={g} className="bg-neon-500/10 text-neon-500 border-neon-500/20">
                {g}
              </Badge>
            ))}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-zinc-200/90">{m.description}</p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="px-4 py-3 text-xs text-zinc-400">Trailer preview</div>
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src={toTrailerEmbedUrl(m.trailerUrl)}
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Showtimes</div>
            <div className="text-xs text-zinc-400">Pick a slot and choose seats like a real cinema app.</div>
          </div>
          {!user ? (
            <Link to="/login">
              <Button>Login to book</Button>
            </Link>
          ) : null}
        </div>

        {showtimesQuery.isLoading ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : showtimesQuery.isError ? (
          <div className="mt-4 text-sm text-rose-200">{getErrorMessage(showtimesQuery.error)}</div>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {(showtimesQuery.data || []).map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <div>
                  <div className="text-sm font-medium">{new Date(s.startTime).toLocaleString()}</div>
                  <div className="text-xs text-zinc-400">
                    {s.theater?.name} • {s.screen?.name}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm text-zinc-200">₹{s.price}</div>
                  <Link to={`/showtimes/${s._id}/seats`}>
                    <Button size="sm">Select seats</Button>
                  </Link>
                </div>
              </div>
            ))}
            {(showtimesQuery.data || []).length === 0 && (
              <div className="text-sm text-zinc-400">No showtimes yet. Run backend seed to generate sample showtimes.</div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function toTrailerEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname.includes('youtu.be')) {
      const id = u.pathname.replace('/', '');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    // ignore
  }
  return 'https://www.youtube.com/embed/dQw4w9WgXcQ';
}

