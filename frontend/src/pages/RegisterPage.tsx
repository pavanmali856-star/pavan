import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../state/auth';
import { getErrorMessage } from '../lib/api';

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState('Neo User');
  const [email, setEmail] = useState(`neo${Date.now()}@pm.pm`);
  const [password, setPassword] = useState('User@12345');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-md">
      <div className="glass rounded-3xl p-6">
        <div className="text-lg font-semibold">Create account</div>
        <div className="mt-1 text-xs text-zinc-400">JWT auth + role-based access (admin/user).</div>

        <form
          className="mt-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setLoading(true);
            try {
              await register(name, email, password);
              nav('/');
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
          />
          <Button disabled={loading} className="w-full">
            {loading ? 'Creating…' : 'Sign up'}
          </Button>
        </form>

        {error && <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm">{error}</div>}

        <div className="mt-5 text-xs text-zinc-400">
          Already have an account? <Link className="text-neon-500 hover:underline" to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

