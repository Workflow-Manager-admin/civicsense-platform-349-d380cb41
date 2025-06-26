import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import ResendConfirmationEmail from "../components/ResendConfirmationEmail";

import Spinner from '../components/Spinner';
import PasswordInput from '../components/PasswordInput';

export default function SignupCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Defensive: Ensure no upsert occurs unless session, user, and email are all valid
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Step 1: Register user via Supabase Auth
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://vscode-internal-21759-beta.beta01.cloud.kavia.ai/login/citizen',
      },
    });

    if (signupError) {
      setError("Signup error: " + signupError.message);
      setLoading(false);
      return;
    }

    const user = signupData?.user;

    // Step 2: If no session yet (email not confirmed), alert user
    if (!user?.id || !user?.email) {
      alert("Signup successful! Please confirm your email, then log in.");
      setLoading(false);
      navigate('/login/citizen');
      return;
    }

    try {
      // Step 3: Wait for session to become active (if it exists)
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;

      if (!sessionUser || sessionUser.id !== user.id) {
        setError("Session not active. Please confirm your email, then log in.");
        setLoading(false);
        return;
      }

      // Step 4: Validate upsert only if all required fields
      if (!user || !user.id || !user.email) {
        setError("Cannot upsert profile: missing user id or email.");
        setLoading(false);
        return;
      }
      if (!sessionUser || !sessionUser.id) {
        setError("Cannot upsert profile: missing session or session user id.");
        setLoading(false);
        return;
      }
      // Defensive: Email must not be empty string (schema requires NOT NULL)
      if (typeof user.email !== 'string' || user.email.trim().length === 0) {
        setError("Cannot upsert profile: user email is empty.");
        setLoading(false);
        return;
      }

      // Step 5: Upsert user profile to 'profiles' table – only after all checks
      const upsertPayload = {
        id: user.id,
        email: user.email, // ✅ This will now be valid
        role: 'citizen',
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
          "Database error saving new user profile: " + profileError.message +
          (rlsHint
            ? "\nCheck your RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)"
            : "")
        );
        setLoading(false);
        return;
      }

      alert("Signup successful! Please confirm your email and log in.");
      setLoading(false);
      navigate('/login/citizen');

    } catch (err) {
      setError("Unexpected error: " + (err.message || err));
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleSignup}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>Sign Up as Citizen</h2>
        {error && <p className="text-red-600 error-message">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
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
      <div style={{ color: "#6b7280", fontSize: "0.95rem", marginTop: 12 }}>
        Already have an account? <span style={{}}>
          {/* Use react-router Link for in-app navigation */}
          <a
            href="/login/citizen"
            style={{ color: "var(--primary)", textDecoration: "underline", cursor: "pointer" }}
            onClick={e => {
              e.preventDefault();
              navigate('/login/citizen');
            }}
          >Login here</a>
        </span>
      </div>
    </div>
  );
}
