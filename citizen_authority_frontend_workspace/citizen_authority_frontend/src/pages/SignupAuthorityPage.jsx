import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

/**
 * Signup page for authority users. After successful signup and upon valid session,
 * upserts user profile into the 'profiles' table with role: 'authority', matching schema.
 * Only affects authority signup; does not impact citizen flow.
 */
import Spinner from '../components/Spinner';

export default function SignupAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // PUBLIC_INTERFACE
  /** Handle signup as authority, and upsert profiles row with role: 'authority' after session is established. */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Register user via Supabase Auth, redirect to login after email confirmation
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/login/authority', // after confirmation
      }
    });

    if (signupError) {
      setError("Database error saving new user: " + signupError.message);
      setLoading(false);
      return;
    }

    const user = signupData?.user;

    // 2. If email not confirmed/session not yet available, prompt to confirm email and stop
    if (!user?.id || !user?.email) {
      alert('Signup successful! Please check your email to confirm your account before logging in.');
      setLoading(false);
      navigate('/login/authority');
      return;
    }

    try {
      // 3. Wait/check for the session to be active (after confirmation)
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (!sessionUser || sessionUser.id !== user.id) {
        setError("Session not active. Please confirm your email, then log in.");
        setLoading(false);
        return;
      }

      // 4. Defensive schema checks
      if (!user || !user.id || !user.email) {
        setError("Cannot upsert authority profile: missing user id or email.");
        setLoading(false);
        return;
      }
      if (!sessionUser || !sessionUser.id) {
        setError("Cannot upsert authority profile: missing session or session user id.");
        setLoading(false);
        return;
      }
      if (typeof user.email !== 'string' || user.email.trim().length === 0) {
        setError("Cannot upsert authority profile: user email is empty.");
        setLoading(false);
        return;
      }

      // 5. Upsert profile in 'profiles' table with role: 'authority'
      const upsertPayload = {
        id: user.id,
        email: user.email,
        role: 'authority', // guaranteed lower-case, as per schema/policy
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([upsertPayload], {
          onConflict: ['id'],
          returning: 'representation',
        });

      if (profileError) {
        const rlsHint =
          profileError.code === 'PGRST116' ||
          profileError.status === 403 ||
          profileError.status === 406;

        setError(
          "Database error saving new authority profile: " + profileError.message +
          (rlsHint
            ? "\nCheck your RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)"
            : "")
        );
        setLoading(false);
        return;
      }

      alert("Signup successful! Please confirm your email and log in as Authority.");
      setLoading(false);
      navigate('/login/authority');
    } catch (err) {
      setError("Unexpected error: " + (err.message || err));
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleSignup}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>Sign Up as Authority</h2>
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
            "Sign Up"
          )}
        </button>
      </form>
      <div style={{ color: "#6b7280", fontSize: "0.95rem", marginTop: 12, textAlign: "center" }}>
        Already have an account?{" "}
        <span>
          <a
            href="/login/authority"
            style={{ color: "var(--primary)", textDecoration: "underline", cursor: "pointer" }}
            onClick={e => {
              e.preventDefault();
              // See main file for potential hook-based navigation
            }}
          >
            Login here
          </a>
        </span>
      </div>
    </div>
  );
}
