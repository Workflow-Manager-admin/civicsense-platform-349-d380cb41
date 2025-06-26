import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import ResendConfirmationEmail from "../components/ResendConfirmationEmail";
import Spinner from '../components/Spinner';

export default function LoginAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

      let { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (
        (!profileData || profileError?.code === 'PGRST116' || profileError?.status === 406 || profileError?.status === 403)
        && user.id && user.email
      ) {
        const sessRes = await supabase.auth.getSession();
        const sessionUser = sessRes?.data?.session?.user;
        const payload = { id: user.id, email: user.email, role: 'authority' };

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

      await supabase.from('logins').insert([
        { user_id: user.id, role: profileData.role }
      ]);

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
