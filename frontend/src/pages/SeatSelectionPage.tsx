import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import { getSocket } from '../lib/socket';
import { Button } from '../components/ui/Button';
import { SeatMap, type SeatPick } from '../components/SeatMap';
import type { Showtime, ShowtimeSeat } from '../types';

type SeatEvent = { showtimeId: string; seats: { row: string; number: number }[] };

function seatKey(s: { row: string; number: number }) {
  return `${s.row}-${s.number}`;
}

export function SeatSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showtimeId = id!;

  const showtimeQuery = useQuery({
    queryKey: ['showtime', showtimeId],
    queryFn: async () => {
      const res = await api.get<Showtime>(`/showtimes/${showtimeId}`);
      return res.data;
    },
    enabled: Boolean(showtimeId),
    refetchOnMount: true,
  });

  const [selected, setSelected] = useState<SeatPick[]>([]);
  const [seats, setSeats] = useState<ShowtimeSeat[]>([]);
  const [holdUntil, setHoldUntil] = useState<number | null>(null);

  useEffect(() => {
    if (showtimeQuery.data?.seats) setSeats(showtimeQuery.data.seats);
  }, [showtimeQuery.data?.seats]);

  const lockMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<{ ttlMs: number }>('/bookings/lock', { showtimeId, seats: selected });
      return res.data;
    },
    onSuccess: (data) => {
      const ttl = data.ttlMs ?? 5 * 60 * 1000;
      setHoldUntil(Date.now() + ttl);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/bookings/unlock', { showtimeId, seats: selected });
      return res.data;
    },
    onSuccess: () => {
      setHoldUntil(null);
    },
  });

  const total = useMemo(() => {
    const selectedSet = new Set(selected.map(seatKey));
    return seats.filter((s) => selectedSet.has(seatKey(s))).reduce((acc, s) => acc + (s.price || 0), 0);
  }, [selected, seats]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('showtime:join', { showtimeId });

    const apply = (event: SeatEvent, status: ShowtimeSeat['status']) => {
      if (event.showtimeId !== showtimeId) return;
      const affected = new Set(event.seats.map(seatKey));
      setSeats((prev) =>
        prev.map((s) => (affected.has(seatKey(s)) ? { ...s, status } : s))
      );
    };

    const onLocked = (payload: any) => apply(payload as SeatEvent, 'Locked');
    const onReleased = (payload: any) => apply(payload as SeatEvent, 'Available');
    const onBooked = (payload: any) => apply(payload as SeatEvent, 'Booked');

    socket.on('seats:locked', onLocked);
    socket.on('seats:released', onReleased);
    socket.on('seats:booked', onBooked);

    return () => {
      socket.emit('showtime:leave', { showtimeId });
      socket.off('seats:locked', onLocked);
      socket.off('seats:released', onReleased);
      socket.off('seats:booked', onBooked);
    };
  }, [showtimeId]);

  const toggle = (pick: SeatPick) => {
    const k = seatKey(pick);
    setSelected((prev) => {
      const has = prev.some((s) => seatKey(s) === k);
      if (has) return prev.filter((s) => seatKey(s) !== k);
      // only allow selecting currently available seats
      const seat = seats.find((s) => seatKey(s) === k);
      if (!seat || seat.status !== 'Available') return prev;
      return [...prev, pick].slice(0, 10); // limit selection
    });
  };

  const timeLeft = holdUntil ? Math.max(0, holdUntil - Date.now()) : 0;
  const timeLeftText = holdUntil
    ? `${Math.floor(timeLeft / 60_000)}:${String(Math.floor((timeLeft % 60_000) / 1000)).padStart(2, '0')}`
    : null;

  useEffect(() => {
    if (!holdUntil) return;
    const t = setInterval(() => {
      if (Date.now() > holdUntil) setHoldUntil(null);
    }, 500);
    return () => clearInterval(t);
  }, [holdUntil]);

  if (showtimeQuery.isLoading) return <div className="glass h-[520px] animate-pulse rounded-3xl" />;
  if (showtimeQuery.isError) return <div className="text-sm text-rose-200">{getErrorMessage(showtimeQuery.error)}</div>;

  const st = showtimeQuery.data!;
  const movieTitle = st.movie?.title ?? 'Showtime';
  const theaterName = st.theater?.name ?? '';
  const screenName = st.screen?.name ?? '';

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-semibold">{movieTitle}</div>
            <div className="text-xs text-zinc-400">
              {new Date(st.startTime).toLocaleString()} • {theaterName} • {screenName}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {holdUntil ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Holding seats • {timeLeftText}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
                Select seats • then hold
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <div className="min-w-[640px]">
            <SeatMap seats={seats} selected={selected} onToggle={toggle} />
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="text-sm font-semibold">Booking summary</div>
            <div className="text-xs text-zinc-400">
              Seats: {selected.length ? selected.map((s) => `${s.row}${s.number}`).join(', ') : '—'} • Total: ₹{total}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={selected.length === 0 || lockMutation.isPending}
              onClick={() => lockMutation.mutate()}
            >
              Hold seats
            </Button>
            <Button
              variant="secondary"
              disabled={selected.length === 0 || unlockMutation.isPending}
              onClick={() => unlockMutation.mutate()}
            >
              Release
            </Button>
            <Button
              disabled={selected.length === 0 || !holdUntil}
              onClick={() => {
                sessionStorage.setItem('pm_checkout', JSON.stringify({ showtimeId, seats: selected }));
                navigate('/checkout');
              }}
            >
              Continue to payment
            </Button>
          </div>
        </div>

        {(lockMutation.isError || unlockMutation.isError) && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
            {getErrorMessage((lockMutation.error as any) ?? unlockMutation.error)}
          </div>
        )}
      </section>
    </div>
  );
}

