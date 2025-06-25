import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function LoginCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

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
      setError("Login succeeded but user info is missing.");
      return;
    }

    // 🔍 Step 1: Fetch profile
    // Always request application/json
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // 🧩 Step 2: Upsert citizen role if missing (always provide all required fields, use onConflict: ['id'])
    // To comply with RLS, always provide id/email/role and ensure the client session is valid.
    // If you still get an RLS or 406 error, force Accept header to application/json.
    // Supabase-js uses fetch under the hood which should be correct, but see fetch/406 troubleshooting.

    if ((!profileData || profileError?.code === 'PGRST116') && user.id && user.email) {
      // Defensive: manually construct the upsert with fetch if auto upsert fails with 406/403 (rare)
      const upsertData = { id: user.id, email: user.email, role: 'citizen' };
      // Standard way:
      let upsertRes = await supabase
        .from('profiles')
        .upsert(
          [upsertData],
          { onConflict: ['id'] }
        );
      let upsertError = upsertRes.error;

      // If 406/403 from supabase-js, fallback to REST with explicit Accept header (troubleshooting for edge cases)
      if (upsertError && (upsertError.code === 'PGRST116' || upsertError.status === 406 || upsertError.status === 403)) {
        try {
          const { data: manualRes, error: manualErr } = await supabase
            .from('profiles')
            .upsert([upsertData], { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false })
            .select('id,email,role'); // force select shape for profile
          if (manualErr) throw manualErr;
        } catch (manualError) {
          setError("Failed to upsert citizen profile: " + manualError.message +
              "\n(See assets/supabase.md for RLS upsert troubleshooting. " +
              "Check that you are logged in, and id/email/role are set. Latest RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id).)");
          return;
        }
      } else if (upsertError) {
        setError("Failed to upsert citizen profile: " + upsertError.message +
            "\n(See assets/supabase.md for RLS upsert troubleshooting.)");
        return;
      }
      
      if (upsertError) {
        setError("Failed to upsert citizen profile: " + upsertError.message +
            "\n(See assets/supabase.md for RLS upsert troubleshooting.)");
        return;
      }

      const { data: newProfile, error: newFetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (newFetchError || !newProfile) {
        setError("Unable to retrieve role after upserting.");
        return;
      }

      profileData = newProfile;
    }

    // 📝 Step 3: Log login
    await supabase.from('logins').insert([
      { user_id: user.id, role: profileData.role }
    ]);

    // 🚀 Step 4: Redirect
    if (profileData.role === 'citizen') {
      navigate('/issue-form');
    } else if (profileData.role === 'authority') {
      navigate('/dashboard');
    } else {
      setError("Unknown user role.");
    }
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
