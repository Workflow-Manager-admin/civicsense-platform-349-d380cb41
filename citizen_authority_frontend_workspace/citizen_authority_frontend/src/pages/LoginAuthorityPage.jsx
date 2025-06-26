import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import ResendConfirmationEmail from "../components/ResendConfirmationEmail";
import Spinner from '../components/Spinner';
import PasswordInput from '../components/PasswordInput';

export default function LoginAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        setError('Login successful, but user info missing.');
        setLoading(false);
        return;
      }

      // ✅ Always fetch the profile role (with maybeSingle for RLS 406/empty)
      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      // If profile missing, self-heal/create profile – strict on session, payload, and diagnostics
      if (
        (!profileData || profileError?.code === 'PGRST116' || profileError?.status === 406 || profileError?.status === 403)
        && user.id && user.email
      ) {
        // Defensive: session must be valid and match this user
        const sessRes = await supabase.auth.getSession();
        const sessionUser = sessRes?.data?.session?.user;
        console.log("[DIAG] LoginAuthorityPage: user object is", user);
        console.log("[DIAG] LoginAuthorityPage: sessionUser is", sessionUser);
        const payload = { id: user.id, email: user.email, role: 'authority' };
        console.log("[DIAG] LoginAuthorityPage: authority profile insert payload:", payload);

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

        // Use upsert instead of insert to allow role switching, or correcting prior state
        // (This ensures if the user was created accidentally as a citizen, logging in via authority will upsert to authority.)
        const { data: upsertProfileData, error: upsertProfileError } = await supabase
          .from('profiles')
          .upsert([payload], { onConflict: ['id'], returning: 'representation' });

        if (upsertProfileError) {
          setError(
            'Could not create authority profile: ' + upsertProfileError.message +
            "\nDiagnostics: sessionUser=" + JSON.stringify(sessionUser) +
            ", user=" + JSON.stringify(user) + ", payload=" + JSON.stringify(payload) +
            "\nSee assets/supabase.md for upsert self-heal policy"
          );
          setLoading(false);
          return;
        }
        if (upsertProfileData) {
          console.log("[DIAG] LoginAuthorityPage: Profile upsert returned data:", upsertProfileData);
        }
        // Re-fetch profile with maybeSingle
        const { data: refetchedProfile, error: refetchError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        if (refetchError || !refetchedProfile) {
          setError('Could not fetch user role after upserting profile (see supabase.md).');
          setLoading(false);
          return;
        }
        profileData = refetchedProfile;
      }

      if (!profileData || !profileData.role) {
        setError('Could not fetch user role from profiles table.');
        setLoading(false);
        return;
      }

      // ✅ Optional: log login
      await supabase.from('logins').insert([
        { user_id: user.id, role: profileData.role }
      ]);

      // ✅ Redirect based on role
      setLoading(false);
      if (profileData.role === 'authority') {
        navigate('/dashboard');
      } else if (profileData.role === 'citizen') {
        navigate('/issue-form');
      } else {
        setError('Unknown role in profile.');
      }
    } catch (err) {
      setError('Unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleLogin}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>Login as Authority</h2>
        {error && (
          <>
            <p className="text-red-600 error-message">{error}</p>
            {/* Additional contextual hint for unconfirmed email */}
            <div
              style={{
                color: "#b85c38",
                background: "#FFEFEF",
                border: "1.2px solid #e57373",
                borderRadius: "8px",
                fontWeight: 500,
                fontSize: "0.99rem",
                padding: "9px 14px",
                marginTop: "4px",
                marginBottom: "6px",
                textAlign: "left"
              }}
              role="note"
              aria-live="polite"
            >
              <span style={{ fontWeight: 700 }}>Tip:</span> If you have not confirmed your email address,
              please check your inbox (and spam/junk folder) for the confirmation link sent to you after signup.
              You must confirm your email before logging in.
              {email && (
                <span style={{ display: "block", marginTop: 7 }}>
                  Didn't get the email? You can&nbsp;
                  <ResendConfirmationEmail email={email} variant="inline" />
                </span>
              )}
            </div>
          </>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button
          className={`btn btn-large mt-2${loading ? " btn-loading" : ""}`}
          type="submit"
          disabled={loading}
          aria-busy={loading}
          style={{ position: "relative", width: "100%" }}
        >
          {/* Spinner must be centered and visible with proper color in loading state */}
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
