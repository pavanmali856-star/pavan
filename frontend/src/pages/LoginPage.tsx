import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../state/auth';
import { getErrorMessage } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('user@pm.pm');
  const [password, setPassword] = useState('User@12345');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-3xl p-6">
        <div className="text-lg font-semibold">Login</div>
        <div className="mt-1 text-xs text-zinc-400">Use seed credentials or create a new account.</div>

        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              await login(email, password);
              nav('/');
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          <Button disabled={loading} className="w-full">
            {loading ? 'Signing in…' : 'Login'}
          </Button>
        </form>

        {error && <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">{error}</div>}

        <div className="mt-5 text-xs text-zinc-400">
          No account? <Link className="text-neon-500 hover:underline" to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}

