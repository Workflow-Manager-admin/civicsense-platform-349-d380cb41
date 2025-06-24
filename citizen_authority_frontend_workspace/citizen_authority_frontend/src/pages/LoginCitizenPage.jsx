import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function LoginCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  /**
   * Handles login for 'citizen' portal.
   * If user's profile role is not 'citizen', logs out and shows a specific error.
   * Checks cross-role uniqueness by querying 'profiles' by email.
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
      setError("Login succeeded but user info is missing.");
      return;
    }

    // Check if another profile exists with this email but different role (authority)
    let { data: roleDupCheck, error: checkErr } = await supabase
      .from('profiles')
      .select('id, role')
      .neq('id', user.id);

    if (checkErr) {
      setError("Could not verify email role uniqueness: " + checkErr.message);
      return;
    }
    // Supabase can't directly map email <-> profile (id) without RLS, basic check is done post-auth here

    // STEP 1: Fetch this user's profile
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // STEP 2: Insert citizen role if missing
    if ((!profileData || profileError?.code === 'PGRST116') && !profileError?.details?.includes('duplicate key value')) {
      // No role yet - create profile for this id/email as citizen
      const { error: insertError } = await supabase.from('profiles').insert([
        { id: user.id, role: 'citizen' }
      ]);
      if (insertError) {
        setError("Failed to insert citizen profile.");
        return;
      }
      const { data: newProfile, error: newFetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (newFetchError || !newProfile) {
        setError("Unable to retrieve role after inserting.");
        return;
      }
      profileData = newProfile;
    }

    // FINAL ENFORCEMENT: If user has a different role, block access, log out, and show error
    if (profileData.role !== 'citizen') {
      await supabase.auth.signOut();
      setError('This email is registered under a different role.');
      return;
    }

    // 📝 (Optional) Insert login to audit log
    await supabase.from('logins').insert([
      { user_id: user.id, role: profileData.role }
    ]);

    // 🚀 Proceed to citizen portal
    navigate('/issue-form');
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleLogin}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>Login as Citizen</h2>
        {error && <p className="text-red-600 error-message">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-large mt-2" type="submit">
          Login
        </button>
      </form>
    </div>
  );
}
