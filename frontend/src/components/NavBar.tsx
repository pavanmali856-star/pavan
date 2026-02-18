import { Link, NavLink } from 'react-router-dom';
import { Film, Shield, Ticket, User } from 'lucide-react';
import { cn } from '../lib/cn';
import { useAuth } from '../state/auth';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/Button';

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'rounded-xl px-3 py-2 text-sm transition',
          isActive ? 'bg-white/10 text-white' : 'text-zinc-300 hover:bg-white/5 hover:text-white'
        )
      }
    >
      {children}
    </NavLink>
  );
}

export function NavBar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-neon-500 text-zinc-950 shadow-[0_10px_30px_rgba(43,231,255,0.2)]">
            <Film size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">PM•PM Cinemaverse</div>
            <div className="text-xs text-zinc-400">Movie tickets, real-time</div>
          </div>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          <NavItem to="/">
            <span className="inline-flex items-center gap-2">
              <Ticket size={16} /> Movies
            </span>
          </NavItem>
          {user && (
            <NavItem to="/me">
              <span className="inline-flex items-center gap-2">
                <User size={16} /> Profile
              </span>
            </NavItem>
          )}
          {isAdmin && (
            <NavItem to="/admin">
              <span className="inline-flex items-center gap-2">
                <Shield size={16} /> Admin
              </span>
            </NavItem>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {!user ? (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="secondary" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign up</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="hidden text-xs text-zinc-300 md:block">
                {user.name} <span className="text-zinc-500">({user.role})</span>
              </div>
              <Button variant="secondary" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

