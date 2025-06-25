import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

export default function LoginAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

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

    // ✅ Always fetch the profile role
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile missing, optionally create it (but only if user.email exists and role is clear)
    if ((!profileData || profileError?.code === 'PGRST116') && user.id && user.email) {
      // Insert authority profile if completely missing (self-healing for initial migration)
      const { error: insertProfileError } = await supabase.from('profiles').insert([
        { id: user.id, email: user.email, role: 'authority' }
      ]);
      if (insertProfileError) {
        setError('Could not create authority profile: ' + insertProfileError.message);
        return;
      }
      // Now re-fetch
      const { data: refetchedProfile, error: refetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (refetchError || !refetchedProfile) {
        setError('Could not fetch user role after creating profile.');
        return;
      }
      // Assign for downstream logic
      profileData = refetchedProfile;
    }

    if (!profileData || !profileData.role) {
      setError('Could not fetch user role from profiles table.');
      return;
    }

    // ✅ Optional: log login
    await supabase.from('logins').insert([
      { user_id: user.id, role: profileData.role }
    ]);

    // ✅ Redirect based on role
    if (profileData.role === 'authority') {
      navigate('/dashboard');
    } else if (profileData.role === 'citizen') {
      navigate('/issue-form');
    } else {
      setError('Unknown role in profile.');
    }
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
