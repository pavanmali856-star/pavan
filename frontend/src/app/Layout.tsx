import { Outlet } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export function Layout() {
  return (
    <div className="min-h-full bg-grid">
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-4 text-xs text-zinc-400">
          PM•PM Cinemaverse — realtime seat locking demo • Swagger at <code>/api/docs</code>
        </div>
      </footer>
    </div>
  );
}

