import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Movie } from '../types';
import { Badge } from './ui/Badge';

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie._id}`}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/7"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="line-clamp-2 text-sm font-semibold">{movie.title}</div>
          <div className="inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs">
            <Star size={14} className="text-neon-500" />
            {movie.rating?.toFixed?.(1) ?? movie.rating}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 p-4">
        {(movie.genre || []).slice(0, 3).map((g) => (
          <Badge key={g}>{g}</Badge>
        ))}
        <Badge className="ml-auto">{(movie.language || []).join(', ')}</Badge>
      </div>
    </Link>
  );
}

