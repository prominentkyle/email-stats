import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error || 'Login failed');
        return;
      }

      if (result?.ok) {
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Email Usage Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main
        style={{
          backgroundColor: 'var(--bg)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--sp-16)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--card)',
            border: `1px solid var(--border)`,
            borderRadius: 'var(--radius-md)',
            padding: 'var(--sp-48)',
            boxShadow: 'var(--shadow-sm)',
            maxWidth: '400px',
            width: '100%',
          }}
        >
          <h1
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 600,
              marginBottom: 'var(--sp-8)',
              color: 'var(--text)',
              textAlign: 'center',
            }}
          >
            Email Usage Dashboard
          </h1>

          <p
            style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: 'var(--sp-32)',
            }}
          >
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-16)' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--sp-8)',
                  letterSpacing: '0.5px',
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text)',
                  transition: 'all 200ms ease',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--sp-8)',
                  letterSpacing: '0.5px',
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg)',
                  border: `1px solid var(--border)`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text)',
                  transition: 'all 200ms ease',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: 'var(--sp-12)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid #EF4444`,
                  borderRadius: 'var(--radius-sm)',
                  color: '#DC2626',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 16px',
                backgroundColor: loading ? 'var(--text-muted)' : 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 200ms ease',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.opacity = '1')}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginTop: 'var(--sp-24)',
            }}
          >
            Default credentials for testing:<br />
            Email: admin@example.com<br />
            Password: admin123
          </p>
        </div>
      </main>
    </>
  );
}
