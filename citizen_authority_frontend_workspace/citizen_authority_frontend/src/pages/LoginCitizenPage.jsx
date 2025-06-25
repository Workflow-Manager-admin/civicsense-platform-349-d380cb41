import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

export default function LoginCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      const user = loginData?.user;
      if (!user) {
        setError("Login succeeded but user info is missing.");
        setLoading(false);
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
        const sessRes = await supabase.auth.getSession();
        const sessionUser = sessRes?.data?.session?.user;

        // Verbose diagnostic logging for RLS/session edge cases
        console.log("[DIAG] LoginCitizenPage: user object returned by login:", user);
        console.log("[DIAG] LoginCitizenPage: sessionUser from getSession():", sessionUser);
        const upsertData = { id: user.id, email: user.email, role: 'citizen' };
        console.log("[DIAG] LoginCitizenPage: upsert payload will be:", upsertData);

        if (!sessionUser || sessionUser.id !== user.id) {
          setError(
            "User session not fully established. Please log out and log back in. (sessionUser=" +
            JSON.stringify(sessionUser) +
            ", user=" +
            JSON.stringify(user) +
            ")"
          );
          setLoading(false);
          return;
        }

        // Strict payload shape (id/email/role and nothing else)
        let upsertRes = await supabase
          .from('profiles')
          .upsert(
            [upsertData],
            { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
          )
          .select('id,email,role');

        let upsertError = upsertRes.error;

        // Detailed diagnostics for all error cases
        if (upsertRes?.data) {
          console.log("[DIAG] Upsert returned data:", upsertRes.data);
        }
        if (upsertError) {
          // Print diagnostic block and propagate full error
          console.error(
            "[DIAG] Upsert failed with error:",
            upsertError, "Payload:", upsertData
          );
        }

        // Catch 406/403 errors, report with troubleshooting context
        if (upsertError && (upsertError.code === 'PGRST116' || upsertError.status === 406 || upsertError.status === 403)) {
          setError(
            "Failed to upsert citizen profile: " +
            upsertError.message +
            "\n(See assets/supabase.md for RLS upsert troubleshooting.)\n" +
            "SessionUser: " + JSON.stringify(sessionUser) + "\n" +
            "User: " + JSON.stringify(user) + "\n" +
            "Upsert payload: " + JSON.stringify(upsertData) + "\n" +
            "Latest RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)."
          );
          setLoading(false);
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
          setLoading(false);
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
          setLoading(false);
          return;
        }
        profileData = newProfile;
      }

      // 📝 Step 3: Log login
      await supabase.from('logins').insert([
        { user_id: user.id, role: profileData.role }
      ]);

      // 🚀 Step 4: Redirect
      setLoading(false);
      if (profileData.role === 'citizen') {
        navigate('/issue-form');
      } else if (profileData.role === 'authority') {
        navigate('/dashboard');
      } else {
        setError("Unknown user role.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
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
        <button
          className={`btn btn-large mt-2${loading ? " btn-loading" : ""}`}
          type="submit"
          disabled={loading}
          aria-busy={loading}
        >
          {/* Ensure Spinner is visible, centered, and color matches button text */}
          {loading ? (
            <span className="btn-spinner" style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex"
            }}>
              <Spinner size={22} inline color="#A8D5BA" />
            </span>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}
