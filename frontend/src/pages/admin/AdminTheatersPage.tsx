import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, getErrorMessage } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Movie } from '../../types';

type Theater = {
  _id: string;
  name: string;
  location: { address: string; city: string; state: string; zipCode: string };
  screens?: { _id: string; name: string; type: string; capacity: number }[];
};

type Screen = { _id: string; name: string; type: string; capacity: number };

function buildSeatLayout() {
  const rows = [];
  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  for (const row of rowLetters) {
    const seats = [];
    for (let n = 1; n <= 12; n++) {
      const isPremium = row === 'G' || row === 'H';
      seats.push({ number: n, type: isPremium ? 'Premium' : 'Standard', priceModifier: isPremium ? 60 : 0, isAvailable: true });
    }
    rows.push({ row, seats });
  }
  return rows;
}

export function AdminTheatersPage() {
  const qc = useQueryClient();
  const theatersQ = useQuery({
    queryKey: ['theaters'],
    queryFn: async () => (await api.get<Theater[]>('/theaters')).data,
  });
  const moviesQ = useQuery({
    queryKey: ['moviesForShowtime'],
    queryFn: async () => (await api.get<{ items: Movie[] }>('/movies', { params: { page: 1, limit: 50 } })).data.items,
  });

  const [theaterDraft, setTheaterDraft] = useState({
    name: 'Skyline CineHub',
    address: '9 Aurora Boulevard',
    city: 'Neo City',
    state: 'Future State',
    zipCode: '100001',
  });

  const createTheaterM = useMutation({
    mutationFn: async () =>
      (await api.post('/theaters', { name: theaterDraft.name, location: { address: theaterDraft.address, city: theaterDraft.city, state: theaterDraft.state, zipCode: theaterDraft.zipCode } })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theaters'] }),
  });

  const [selectedTheaterId, setSelectedTheaterId] = useState<string>('');
  const selectedTheater = useMemo(() => (theatersQ.data || []).find((t) => t._id === selectedTheaterId) ?? null, [theatersQ.data, selectedTheaterId]);

  const [screenDraft, setScreenDraft] = useState({ name: 'Screen 2 — Neon', type: 'Standard', capacity: 96 });
  const addScreenM = useMutation({
    mutationFn: async () =>
      (await api.post(`/theaters/${selectedTheaterId}/screens`, { ...screenDraft, seatLayout: buildSeatLayout() })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['theaters'] }),
  });

  const [showtimeDraft, setShowtimeDraft] = useState({
    movie: '',
    screen: '',
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
    price: 220,
  });
  const createShowtimeM = useMutation({
    mutationFn: async () =>
      (await api.post('/showtimes', { movie: showtimeDraft.movie, theater: selectedTheaterId, screen: showtimeDraft.screen, startTime: new Date(showtimeDraft.startTime).toISOString(), price: Number(showtimeDraft.price) })).data,
    onSuccess: () => {
      setShowtimeDraft((d) => ({ ...d, startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16) }));
    },
  });

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Theaters & screens</div>
            <div className="mt-1 text-xs text-zinc-400">Manage Theaters, Screens, Seat Layout, and Showtimes.</div>
          </div>
          <Link to="/admin">
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="text-sm font-semibold">Create theater</div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Input value={theaterDraft.name} onChange={(e) => setTheaterDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" />
          <Input value={theaterDraft.address} onChange={(e) => setTheaterDraft((d) => ({ ...d, address: e.target.value }))} placeholder="Address" />
          <Input value={theaterDraft.city} onChange={(e) => setTheaterDraft((d) => ({ ...d, city: e.target.value }))} placeholder="City" />
          <Input value={theaterDraft.state} onChange={(e) => setTheaterDraft((d) => ({ ...d, state: e.target.value }))} placeholder="State" />
          <Input value={theaterDraft.zipCode} onChange={(e) => setTheaterDraft((d) => ({ ...d, zipCode: e.target.value }))} placeholder="Zip" />
        </div>
        <div className="mt-4">
          <Button disabled={createTheaterM.isPending} onClick={() => createTheaterM.mutate()}>
            Create theater
          </Button>
        </div>
        {createTheaterM.isError && <div className="mt-4 text-sm text-rose-200">{getErrorMessage(createTheaterM.error)}</div>}
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="text-sm font-semibold">Select theater</div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(theatersQ.data || []).map((t) => (
            <button
              key={t._id}
              onClick={() => setSelectedTheaterId(t._id)}
              className={`rounded-2xl border px-4 py-4 text-left ${selectedTheaterId === t._id ? 'border-neon-500 bg-neon-500/10' : 'border-white/10 bg-white/5 hover:bg-white/7'}`}
            >
              <div className="text-sm font-medium">{t.name}</div>
              <div className="text-xs text-zinc-400">{t.location.city}, {t.location.state}</div>
              <div className="mt-2 text-xs text-zinc-400">{(t.screens || []).length} screens</div>
            </button>
          ))}
        </div>
        {theatersQ.isError && <div className="mt-4 text-sm text-rose-200">{getErrorMessage(theatersQ.error)}</div>}
      </section>

      {selectedTheater && (
        <>
          <section className="glass rounded-3xl p-6">
            <div className="text-sm font-semibold">Add screen to {selectedTheater.name}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Input value={screenDraft.name} onChange={(e) => setScreenDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Screen name" />
              <Input value={screenDraft.type} onChange={(e) => setScreenDraft((d) => ({ ...d, type: e.target.value }))} placeholder="Type (Standard/IMAX/3D…)" />
              <Input value={String(screenDraft.capacity)} onChange={(e) => setScreenDraft((d) => ({ ...d, capacity: Number(e.target.value || 0) }))} placeholder="Capacity" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              <Button disabled={addScreenM.isPending} onClick={() => addScreenM.mutate()}>
                Add screen (auto seat layout)
              </Button>
              <div className="text-xs text-zinc-400">Creates `Screens` + materializes `Seats` collection.</div>
            </div>
            {addScreenM.isError && <div className="mt-4 text-sm text-rose-200">{getErrorMessage(addScreenM.error)}</div>}
          </section>

          <section className="glass rounded-3xl p-6">
            <div className="text-sm font-semibold">Create showtime</div>
            <div className="mt-1 text-xs text-zinc-400">Showtime seats are generated from the screen seat layout.</div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
                value={showtimeDraft.movie}
                onChange={(e) => setShowtimeDraft((d) => ({ ...d, movie: e.target.value }))}
              >
                <option value="">Select movie</option>
                {(moviesQ.data || []).map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <select
                className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm"
                value={showtimeDraft.screen}
                onChange={(e) => setShowtimeDraft((d) => ({ ...d, screen: e.target.value }))}
              >
                <option value="">Select screen</option>
                {(selectedTheater.screens || []).map((s: Screen) => (
                  <option key={s._id} value={s._id}>
                    {s.name} • {s.type}
                  </option>
                ))}
              </select>
              <Input
                value={showtimeDraft.startTime}
                onChange={(e) => setShowtimeDraft((d) => ({ ...d, startTime: e.target.value }))}
                type="datetime-local"
              />
              <Input value={String(showtimeDraft.price)} onChange={(e) => setShowtimeDraft((d) => ({ ...d, price: Number(e.target.value || 0) }))} placeholder="Base price" />
            </div>

            <div className="mt-4">
              <Button
                disabled={createShowtimeM.isPending || !showtimeDraft.movie || !showtimeDraft.screen}
                onClick={() => createShowtimeM.mutate()}
              >
                Create showtime
              </Button>
            </div>
            {createShowtimeM.isError && <div className="mt-4 text-sm text-rose-200">{getErrorMessage(createShowtimeM.error)}</div>}
          </section>
        </>
      )}
    </div>
  );
}

