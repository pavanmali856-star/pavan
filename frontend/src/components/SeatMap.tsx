import { cn } from '../lib/cn';
import type { ShowtimeSeat } from '../types';

export type SeatPick = { row: string; number: number };

function keyOf(s: SeatPick) {
  return `${s.row}-${s.number}`;
}

export function SeatMap({
  seats,
  selected,
  onToggle,
}: {
  seats: ShowtimeSeat[];
  selected: SeatPick[];
  onToggle: (s: SeatPick) => void;
}) {
  const byRow = new Map<string, ShowtimeSeat[]>();
  for (const s of seats) {
    if (!byRow.has(s.row)) byRow.set(s.row, []);
    byRow.get(s.row)!.push(s);
  }
  const rows = [...byRow.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  const selectedSet = new Set(selected.map(keyOf));

  return (
    <div className="space-y-2">
      <div className="mb-4 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-full bg-white/10 px-6 py-2 text-center text-xs text-zinc-300">
          SCREEN
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(([row, rowSeats]) => {
          const sorted = [...rowSeats].sort((a, b) => a.number - b.number);
          return (
            <div key={row} className="flex items-center gap-3">
              <div className="w-6 text-right text-xs text-zinc-400">{row}</div>
              <div className="flex flex-1 flex-wrap gap-2">
                {sorted.map((s) => {
                  const k = `${s.row}-${s.number}`;
                  const isSelected = selectedSet.has(k);
                  const disabled = s.status !== 'Available' && !isSelected;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => onToggle({ row: s.row, number: s.number })}
                      disabled={disabled}
                      className={cn(
                        'h-9 w-9 rounded-lg text-xs transition border',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        s.status === 'Available' && 'bg-white/5 border-white/10 hover:bg-white/10',
                        s.status === 'Locked' && 'bg-amber-500/15 border-amber-500/30',
                        s.status === 'Booked' && 'bg-rose-500/15 border-rose-500/30',
                        isSelected && 'bg-neon-500 text-zinc-950 border-neon-500'
                      )}
                      title={`${s.row}${s.number} • ${s.type} • ₹${s.price} • ${s.status}`}
                    >
                      {s.number}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-400">
        <Legend label="Available" className="bg-white/5 border-white/10" />
        <Legend label="Locked" className="bg-amber-500/15 border-amber-500/30" />
        <Legend label="Booked" className="bg-rose-500/15 border-rose-500/30" />
        <Legend label="Selected" className="bg-neon-500 border-neon-500 text-zinc-950" />
      </div>
    </div>
  );
}

function Legend({ label, className }: { label: string; className: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={cn('inline-block h-4 w-4 rounded border', className)} />
      {label}
    </div>
  );
}

