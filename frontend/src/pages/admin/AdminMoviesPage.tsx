import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Movie, MoviesPageResponse } from '../../types';

export function AdminMoviesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState('');

  const listQ = useQuery({
    queryKey: ['adminMovies', q],
    queryFn: async () => (await api.get<MoviesPageResponse>('/movies', { params: { q, page: 1, limit: 20, sort: 'newest' } })).data,
  });

  const [draft, setDraft] = useState<Partial<Movie>>({
    title: '',
    description: '',
    genre: ['Sci-Fi'],
    duration: 120,
    language: ['English'],
    releaseDate: new Date().toISOString(),
    posterUrl: '',
    trailerUrl: '',
    rating: 7.5,
  });

  const createM = useMutation({
    mutationFn: async () => (await api.post<Movie>('/movies', draft)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminMovies'] });
      qc.invalidateQueries({ queryKey: ['movies'] });
      setDraft((d) => ({ ...d, title: '', description: '' }));
    },
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/movies/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminMovies'] });
      qc.invalidateQueries({ queryKey: ['movies'] });
    },
  });

  const items = listQ.data?.items ?? [];

  const canCreate = useMemo(() => Boolean(draft.title && draft.description && draft.posterUrl && draft.trailerUrl), [draft]);

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Movies management</div>
            <div className="mt-1 text-xs text-zinc-400">Admin-only CRUD for the Movies collection.</div>
          </div>
          <Link to="/admin">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="text-sm font-semibold">Create movie</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input placeholder="Title" value={draft.title ?? ''} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <Input placeholder="Poster URL" value={draft.posterUrl ?? ''} onChange={(e) => setDraft((d) => ({ ...d, posterUrl: e.target.value }))} />
          <Input placeholder="Trailer URL" value={draft.trailerUrl ?? ''} onChange={(e) => setDraft((d) => ({ ...d, trailerUrl: e.target.value }))} />
          <Input placeholder="Genres (comma-separated)" value={(draft.genre ?? []).join(', ')} onChange={(e) => setDraft((d) => ({ ...d, genre: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} />
          <Input placeholder="Languages (comma-separated)" value={(draft.language ?? []).join(', ')} onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) }))} />
          <Input placeholder="Duration (minutes)" value={String(draft.duration ?? 120)} onChange={(e) => setDraft((d) => ({ ...d, duration: Number(e.target.value || 0) }))} />
          <div className="md:col-span-2">
            <Input placeholder="Description" value={draft.description ?? ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
          </div>
        </div>
        <div className="mt-4">
          <Button disabled={!canCreate || createM.isPending} onClick={() => createM.mutate()}>
            {createM.isPending ? 'Creating…' : 'Create movie'}
          </Button>
        </div>
        {createM.isError && <div className="mt-4 text-sm text-rose-200">{getErrorMessage(createM.error)}</div>}
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-semibold">Existing movies</div>
            <div className="mt-1 text-xs text-zinc-400">Search is backed by server-side filtering.</div>
          </div>
          <div className="w-full md:w-[380px]">
            <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>

        {listQ.isLoading ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : listQ.isError ? (
          <div className="mt-4 text-sm text-rose-200">{getErrorMessage(listQ.error)}</div>
        ) : (
          <div className="mt-4 space-y-3">
            {items.map((m) => (
              <div key={m._id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <img src={m.posterUrl} className="h-14 w-11 rounded-xl object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-zinc-400">{(m.genre || []).join(', ')}</div>
                </div>
                <Button variant="danger" size="sm" disabled={deleteM.isPending} onClick={() => deleteM.mutate(m._id)}>
                  Delete
                </Button>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-zinc-400">No movies found.</div>}
          </div>
        )}
      </section>
    </div>
  );
}

