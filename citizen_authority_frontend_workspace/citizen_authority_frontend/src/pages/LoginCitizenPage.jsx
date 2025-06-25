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
      // Defensive: check session before upsert
      // 🔥 BUGFIX: Always refresh session via supabase.auth.getUser() AND supabase.auth.getSession(), to guarantee auth context is not stale
      let sessionUser = null;
      try {
        // supabase.auth.refreshSession() is not available in v2+, so we just re-get user and session
        const userRes = await supabase.auth.getUser();
        if (userRes?.data?.user) sessionUser = userRes.data.user;
        const sessRes = await supabase.auth.getSession();
        if (sessRes?.data?.session?.user) sessionUser = sessRes.data.session.user;
      } catch (e) {
        // Defensive, shouldn't happen unless client totally misconfigured
        setError("Supabase session error: " + e.message);
        return;
      }

      // Extra hard failsafe: if sessionUser missing, force a logout for full re-login flow
      if (!sessionUser || sessionUser.id !== user.id) {
        await supabase.auth.signOut(); // Clear any partial session
        setError(
          "User session is not fully established or mismatched. Please log in again to continue. (sessionUser=" +
          JSON.stringify(sessionUser) +
          ", user=" +
          JSON.stringify(user) +
          ")\nIf this recurs after re-login, please contact support (potential browser localstorage/cookie issue)."
        );
        return;
      }

      // Strict payload shape (id/email/role and nothing else)
      const upsertData = { id: user.id, email: user.email, role: 'citizen' };
      console.log("[DIAG] LoginCitizenPage: Final validated sessionUser is:", sessionUser);
      console.log("[DIAG] LoginCitizenPage: Upsert payload about to send:", upsertData);

      let upsertRes = await supabase
        .from('profiles')
        .upsert(
          [upsertData],
          { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
        )
        .select('id,email,role');

      let upsertError = upsertRes.error;

      // Diagnostics for all error cases
      if (upsertRes?.data) console.log("[DIAG] Upsert returned data:", upsertRes.data);
      if (upsertError) console.error("[DIAG] Upsert failed with error:", upsertError, "Payload:", upsertData);

      // If we fail on RLS, forcibly log out so the user can start from a clean session
      if (upsertError && (upsertError.code === '42501' || upsertError.code === 'PGRST116' || upsertError.status === 406 || upsertError.status === 403)) {
        await supabase.auth.signOut();
        setError(
          "Failed to upsert citizen profile due to security/session issue: " +
          upsertError.message +
          "\nA forced logout was performed. Please log in again to re-sync your session context for profile update.\n\n" +
          "SessionUser: " + JSON.stringify(sessionUser) + "\n" +
          "User: " + JSON.stringify(user) + "\n" +
          "Upsert payload: " + JSON.stringify(upsertData) + "\n" +
          "If this persists, an admin must check Supabase policies and client key/project setup.\n" +
          "Latest RLS policy must be: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)."
        );
        return;
      } else if (upsertError) {
        setError(
          "Failed to upsert citizen profile: " +
          upsertError.message +
          "\nSessionUser: " +
          JSON.stringify(sessionUser) +
          "\nUser: " +
          JSON.stringify(user) +
          "\nPayload: " +
          JSON.stringify(upsertData) +
          "\nSee assets/supabase.md for troubleshooting."
        );
        return;
      }
      // Fetch profile again defensively with maybeSingle
      const { data: newProfile, error: newFetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (newFetchError || !newProfile) {
        setError("Unable to retrieve role after upserting (see supabase.md troubleshooting).");
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
