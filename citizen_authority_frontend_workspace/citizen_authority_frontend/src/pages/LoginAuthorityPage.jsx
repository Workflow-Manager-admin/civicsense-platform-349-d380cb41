import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

export default function LoginAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // PUBLIC_INTERFACE
  /**
   * Handles login for the 'authority' portal.
   * If user's profile role is not 'authority', logs out and shows error.
   * Checks for cross-role uniqueness.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // Sign in with Supabase Auth
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    const user = loginData?.user;
    if (!user) {
      setError('Login successful, but user info missing.');
      return;
    }

    // Check for role conflict: only authorities can login here
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If no profile (should not happen), block login
    if (!profileData || profileError) {
      await supabase.auth.signOut();
      setError('This email is registered under a different role.');
      return;
    }

    // Explicit enforcement of authority role for this portal
    if (profileData.role !== 'authority') {
      await supabase.auth.signOut();
      setError('This email is registered under a different role.');
      return;
    }

    // (Optional) Log login event
    await supabase.from('logins').insert([
      { user_id: user.id, role: profileData.role }
    ]);

    navigate('/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleLogin}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>Login as Authority</h2>
        {error && <p className="text-red-600 error-message">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-large mt-2" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
