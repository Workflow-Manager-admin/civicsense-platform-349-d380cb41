import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

export default function LoginCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      if (
        (!profileData || profileError?.code === 'PGRST116' || profileError?.status === 406 || profileError?.status === 403) &&
        user.id &&
        user.email
      ) {
        const sessRes = await supabase.auth.getSession();
        const sessionUser = sessRes?.data?.session?.user;

        const upsertData = { id: user.id, email: user.email, role: 'citizen' };

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

        let upsertRes = await supabase
          .from('profiles')
          .upsert(
            [upsertData],
            { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
          )
          .select('id,email,role');

        let upsertError = upsertRes.error;

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
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            style={{
              position: "absolute",
              right: 8,
              top: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#C08457"
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((prev) => !prev)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <button
          className={`btn btn-large mt-2${loading ? " btn-loading" : ""}`}
          type="submit"
          disabled={loading}
          aria-busy={loading}
          style={{ position: "relative", width: "100%" }}
        >
          {loading ? (
            <span className="btn-spinner" style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
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
