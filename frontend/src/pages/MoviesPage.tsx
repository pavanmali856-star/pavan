import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api, getErrorMessage } from '../lib/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MovieCard } from '../components/MovieCard';
import type { MoviesPageResponse } from '../types';

type AutoItem = { _id: string; title: string; posterUrl: string; rating: number };

export function MoviesPage() {
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [page, setPage] = useState(1);

  const queryKey = useMemo(() => ['movies', { q, genre, language, minRating, page }], [q, genre, language, minRating, page]);

  const moviesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get<MoviesPageResponse>('/movies', {
        params: {
          q: q || undefined,
          genre: genre || undefined,
          language: language || undefined,
          minRating: minRating || undefined,
          page,
          limit: 12,
          sort: 'newest',
        },
      });
      return res.data;
    },
  });

  const [auto, setAuto] = useState<AutoItem[]>([]);
  const [autoOpen, setAutoOpen] = useState(false);
  useEffect(() => {
    if (!q.trim()) {
      setAuto([]);
      setAutoOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get<{ items: AutoItem[] }>('/movies/autocomplete', { params: { q } });
        setAuto(res.data.items || []);
        setAutoOpen(true);
      } catch {
        setAuto([]);
        setAutoOpen(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const payload = moviesQuery.data;

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <div className="text-sm font-semibold">Discover</div>
            <div className="text-xs text-zinc-400">Filters, autocomplete, pagination, and modern UX.</div>
          </div>

          <div className="relative w-full md:w-[440px]">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                onFocus={() => setAutoOpen(Boolean(auto.length))}
                placeholder="Search movies…"
                className="pl-11"
              />
            </div>
            {autoOpen && auto.length > 0 && (
              <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur">
                {auto.map((m) => (
                  <a
                    key={m._id}
                    href={`/movies/${m._id}`}
                    className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/5"
                  >
                    <img src={m.posterUrl} className="h-10 w-8 rounded-lg object-cover" />
                    <div className="flex-1">
                      <div className="font-medium">{m.title}</div>
                      <div className="text-xs text-zinc-400">Rating {m.rating?.toFixed?.(1) ?? m.rating}</div>
                    </div>
                  </a>
                ))}
                <div className="border-t border-white/10 px-4 py-2 text-xs text-zinc-400">
                  Tip: try “NEON”, “ORBIT”, “NOIR” after seeding.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            placeholder="Genre (e.g. Sci-Fi)"
            value={genre}
            onChange={(e) => {
              setGenre(e.target.value);
              setPage(1);
            }}
          />
          <Input
            placeholder="Language (e.g. English)"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
          />
          <Input
            placeholder="Min rating (e.g. 7.5)"
            value={minRating ? String(minRating) : ''}
            onChange={(e) => {
              setMinRating(Number(e.target.value || 0));
              setPage(1);
            }}
          />
          <Button
            variant="secondary"
            onClick={() => {
              setQ('');
              setGenre('');
              setLanguage('');
              setMinRating(0);
              setPage(1);
              setAuto([]);
              setAutoOpen(false);
            }}
          >
            Reset
          </Button>
        </div>
      </section>

      {moviesQuery.isError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
          {getErrorMessage(moviesQuery.error)}
        </div>
      )}

      {moviesQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] animate-pulse rounded-2xl bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {(payload?.items || []).map((m) => (
            <MovieCard key={m._id} movie={m} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-400">
          {payload ? (
            <>
              Page <span className="text-zinc-200">{payload.page}</span> / {payload.totalPages} • {payload.total} movies
            </>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Prev
          </Button>
          <Button
            size="sm"
            disabled={!payload || page >= payload.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

