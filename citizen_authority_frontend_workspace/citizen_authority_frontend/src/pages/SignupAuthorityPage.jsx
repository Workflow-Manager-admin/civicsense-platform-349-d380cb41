/* src/pages/SignupAuthorityPage.jsx */
import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

import Spinner from '../components/Spinner';
import PasswordInput from '../components/PasswordInput';

/**
 * Sign-up page for **Authority** users.
 * After a successful sign-up (and an active session) it upserts a row in
 * the `profiles` table with `role: 'authority'`.
 */
export default function SignupAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // Handle sign-up
  // ---------------------------------------------------------------------------
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/login/authority',
      },
    });

    if (signupError) {
      setError(`Signup error: ${signupError.message}`);
      setLoading(false);
      return;
    }

    const user = signupData?.user;

    // No confirmed e-mail yet → tell the user, then send them to login
    if (!user?.id || !user?.email) {
      alert('Signup successful! Please confirm your email, then log in.');
      setLoading(false);
      navigate('/login/authority');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (!sessionUser || sessionUser.id !== user.id) {
        setError('Session not active. Please confirm your email, then log in.');
        setLoading(false);
        return;
      }

      // ─────────────────────────────────────────────────────────────────────────
      // Defensive checks
      // ─────────────────────────────────────────────────────────────────────────
      if (!user.email?.trim()) {
        setError('Cannot upsert profile: user email is empty.');
        setLoading(false);
        return;
      }

      // Upsert profile row
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          [{ id: user.id, email: user.email, role: 'authority' }],
          { onConflict: ['id'], returning: 'representation' },
        );

      if (profileError) {
        const rlsHint =
          profileError.code === 'PGRST116' ||
          profileError.status === 403 ||
          profileError.status === 406;

        setError(
          `Database error saving profile: ${profileError.message}${
            rlsHint
              ? '\nCheck your RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)'
              : ''
          }`,
        );
        setLoading(false);
        return;
      }

      alert('Signup successful! Please confirm your email, then log in.');
      setLoading(false);
      navigate('/login/authority');
    } catch (err) {
      setError(`Unexpected error: ${err.message || err}`);
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div
      className="container"
      style={{ maxWidth: 440, margin: '50px auto', paddingTop: 64 }}
    >
      <form className="card-bg" onSubmit={handleSignup}>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: 'var(--primary)' }}
        >
          Sign Up as Authority
        </h2>

        {error && <p className="text-red-600 error-message">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
          minLength={6}
          autoComplete="new-password"
        />

        <button
          type="submit"
          className={`btn btn-large mt-2${loading ? ' btn-loading' : ''}`}
          disabled={loading}
          aria-busy={loading}
          style={{ position: 'relative', width: '100%' }}
        >
          {loading ? (
            <span
              className="btn-spinner"
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spinner size={22} inline color="#A8D5BA" />
            </span>
          ) : (
            'Sign Up'
          )}
        </button>
      </form>

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* Already-have-account link → Authority login (SPA navigation)           */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      <p
        style={{
          color: '#6b7280',
          fontSize: '0.95rem',
          marginTop: 12,
          textAlign: 'center',
        }}
      >
        Already have an account?{' '}
        <Link
          to="/login/authority"  /* change to "/login/citizen" if desired */
          style={{ color: 'var(--primary)', textDecoration: 'underline' }}
        >
          Login here
        </Link>
      </p>
    </div>
  );
}
