import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api, getErrorMessage } from '../lib/api';
import { Button } from '../components/ui/Button';
import type { Showtime } from '../types';

type CheckoutState = { showtimeId: string; seats: { row: string; number: number }[] };

export function CheckoutPage() {
  const navigate = useNavigate();
  const state = useMemo<CheckoutState | null>(() => {
    try {
      const raw = sessionStorage.getItem('pm_checkout');
      return raw ? (JSON.parse(raw) as CheckoutState) : null;
    } catch {
      return null;
    }
  }, []);

  const showtimeQuery = useQuery({
    queryKey: ['checkoutShowtime', state?.showtimeId],
    queryFn: async () => {
      const res = await api.get<Showtime>(`/showtimes/${state!.showtimeId}`);
      return res.data;
    },
    enabled: Boolean(state?.showtimeId),
  });

  const seatsPrice = useMemo(() => {
    if (!state || !showtimeQuery.data) return 0;
    const selectedSet = new Set(state.seats.map((s) => `${s.row}-${s.number}`));
    return (showtimeQuery.data.seats || [])
      .filter((s) => selectedSet.has(`${s.row}-${s.number}`))
      .reduce((acc, s) => acc + (s.price || 0), 0);
  }, [state, showtimeQuery.data]);

  const [provider, setProvider] = useState<'mock_stripe' | 'mock_razorpay'>('mock_stripe');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const createIntent = useMutation({
    mutationFn: async () => {
      const res = await api.post('/payments/create-intent', { amount: seatsPrice, provider, currency: 'INR' });
      return res.data as { paymentId: string; clientSecret: string; status: string };
    },
    onSuccess: (d) => setPaymentId(d.paymentId),
  });

  const verifyAndBook = useMutation({
    mutationFn: async () => {
      if (!state) throw new Error('Missing checkout state');
      if (!paymentId) throw new Error('Create payment intent first');

      await api.post('/payments/verify', { paymentId, success: true });
      const res = await api.post('/bookings', { showtimeId: state.showtimeId, seats: state.seats, paymentId });
      return res.data as any;
    },
    onSuccess: () => {
      sessionStorage.removeItem('pm_checkout');
      navigate('/me');
    },
  });

  if (!state) {
    return (
      <div className="glass rounded-3xl p-6">
        <div className="text-sm text-zinc-300">No checkout session found.</div>
        <div className="mt-4">
          <Link to="/">
            <Button>Back to movies</Button>
          </Link>
        </div>
      </div>
    );
  }

  const st = showtimeQuery.data;

  return (
    <div className="space-y-6">
      <section className="glass rounded-3xl p-6">
        <div className="text-lg font-semibold">Payment</div>
        <div className="mt-1 text-xs text-zinc-400">Mock Stripe/Razorpay simulation with persisted payments collection.</div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Booking summary</div>
            <div className="mt-2 text-sm text-zinc-200">{st?.movie?.title ?? 'Showtime'}</div>
            <div className="text-xs text-zinc-400">
              {st ? new Date(st.startTime).toLocaleString() : ''} • {st?.theater?.name ?? ''} • {st?.screen?.name ?? ''}
            </div>
            <div className="mt-3 text-xs text-zinc-300">
              Seats: <span className="text-zinc-100">{state.seats.map((s) => `${s.row}${s.number}`).join(', ')}</span>
            </div>
            <div className="mt-2 text-xs text-zinc-300">
              Amount: <span className="text-neon-500 font-semibold">₹{seatsPrice}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Choose provider</div>
            <div className="mt-3 flex gap-2">
              <button
                className={`flex-1 rounded-xl border px-3 py-3 text-sm ${
                  provider === 'mock_stripe' ? 'border-neon-500 bg-neon-500/10' : 'border-white/10 bg-white/5'
                }`}
                onClick={() => setProvider('mock_stripe')}
              >
                Mock Stripe
              </button>
              <button
                className={`flex-1 rounded-xl border px-3 py-3 text-sm ${
                  provider === 'mock_razorpay' ? 'border-neon-500 bg-neon-500/10' : 'border-white/10 bg-white/5'
                }`}
                onClick={() => setProvider('mock_razorpay')}
              >
                Mock Razorpay
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={seatsPrice <= 0 || createIntent.isPending}
                onClick={() => createIntent.mutate()}
              >
                Create payment intent
              </Button>
              <Button disabled={!paymentId || verifyAndBook.isPending} onClick={() => verifyAndBook.mutate()}>
                Pay & confirm booking
              </Button>
            </div>

            {paymentId && <div className="mt-3 text-xs text-zinc-400">Payment ID: {paymentId}</div>}
          </div>
        </div>

        {(createIntent.isError || verifyAndBook.isError) && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">
            {getErrorMessage((createIntent.error as any) ?? verifyAndBook.error)}
          </div>
        )}
      </section>
    </div>
  );
}

