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

    // 🔍 Step 1: Fetch profile (use maybeSingle to avoid 406)
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Defensive: Only attempt upsert if profile missing, and after checking (re-)logged in user session
    if (
      (!profileData || profileError?.code === 'PGRST116' || profileError?.status === 406 || profileError?.status === 403) &&
      user.id &&
      user.email
    ) {
      const sessRes = await supabase.auth.getSession();
      const sessionUser = sessRes?.data?.session?.user;

      // Log diagnostic info (output to browser console)
      console.log("[DIAG] LoginCitizenPage: user object returned by login:", user);
      console.log("[DIAG] LoginCitizenPage: sessionUser from getSession():", sessionUser);
      console.log("[DIAG] LoginCitizenPage: upsert payload will be:", { id: user.id, email: user.email, role: 'citizen' });

      if (!sessionUser || sessionUser.id !== user.id) {
        setError(
          "User session not fully established. Please log out and log back in. (sessionUser=" +
            JSON.stringify(sessionUser) +
            ", user=" +
            JSON.stringify(user) +
            ")"
        );
        return;
      }
      const upsertData = { id: user.id, email: user.email, role: 'citizen' };

      let upsertRes = await supabase
        .from('profiles')
        .upsert(
          [upsertData],
          { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
        )
        .select('id,email,role');
      let upsertError = upsertRes.error;

      // Log diagnostic info for upsert
      if (upsertRes?.data) {
        console.log("[DIAG] Upsert returned data:", upsertRes.data);
      }
      if (upsertError) {
        console.error("[DIAG] Upsert failed with error:", upsertError, "Payload:", upsertData);
      }

      // If 406/403, inform user and point at troubleshooting, and show more detail (with diagnostics)
      if (upsertError && (upsertError.code === 'PGRST116' || upsertError.status === 406 || upsertError.status === 403)) {
        setError(
          "Failed to upsert citizen profile: " +
            upsertError.message +
            "\n" +
            "(See assets/supabase.md for RLS upsert troubleshooting.)\n" +
            "SessionUser: " + JSON.stringify(sessionUser) + "\n" +
            "User: " + JSON.stringify(user) + "\n"+
            "Upsert payload: " + JSON.stringify(upsertData) + "\n" +
            "Latest RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)."
        );
        return;
      } else if (upsertError) {
        setError(
          "Failed to upsert citizen profile: " +
            upsertError.message +
            "\nUpsert Diagnostics:\nSessionUser: " +
            JSON.stringify(sessionUser) +
            "\nUser: " +
            JSON.stringify(user) +
            "\nPayload: " +
            JSON.stringify(upsertData) +
            "\nSee assets/supabase.md for RLS upsert troubleshooting."
        );
        return;
      }
      // Fetch profile *again* using maybeSingle for 100% safe fallback
      const { data: newProfile, error: newFetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

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
