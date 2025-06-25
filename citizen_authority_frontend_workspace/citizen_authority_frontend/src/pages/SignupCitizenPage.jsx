import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

/**
 * Signup page for citizens.
 * Handles creation of auth account and profile role in Supabase.
 */
export default function SignupCitizenPage() {
  // (Diagnostics of Supabase environment variables and process.env removed
  // since runtime access to process.env is not supported in the browser.
  // Supabase is already configured in supabaseClient.js using proper build-time env injection.)

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  /**
   * Handles the signup process for a new citizen:
   * - Registers user with Supabase Auth.
   * - Provides safe profile upsert logic: Upsert is only attempted if a valid user object (with *both* id and email) is returned by Supabase. 
   * - Otherwise, notifies user to confirm email and login, following Supabase best practices to avoid database constraint/RLS errors.
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Register user with Supabase Auth
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/login/citizen',
      },
    });

    if (signupError) {
      setError("Signup error: " + signupError.message);
      return;
    }

    // Supabase may NOT return a user in signupData immediately if email needs confirmation.
    // Insert profile row ONLY if a complete user object is present.
    const user = signupData?.user;

    if (!user || !user.id || !user.email) {
      // No insert at this stage; wait for login after confirmation.
      alert(
        "Signup successful! Please check your email to confirm your account. After confirmation, log in to complete registration."
      );
      navigate('/login/citizen');
      return;
    }

    try {
      // ------------- RLS/PROFILE POLICY IMPACT -------------
      // All upserts to 'profiles' MUST supply id=user.id, email, and role. The RLS policy for INSERT/UPDATE:
      //   USING (auth.uid() = id)
      //   WITH CHECK (auth.uid() = id)
      // This enforces that only the authenticated user can create/update *their* profile row.
      // If this upsert fails, check latest policy in assets/supabase.md and assets/supabase_applied_rls.sql.

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          [{ id: user.id, email: user.email, role: 'citizen' }],
          { onConflict: ['id'] }
        );

      if (profileError) {
        setError(
          "Database error saving new user profile: " + profileError.message +
          "\nIf you see RLS/permission errors, confirm policies as described in assets/supabase.md."
        );
        return;
      }

      alert(
        'Signup successful! Profile created. Please check your email to confirm, then log in.'
      );
      navigate('/login/citizen');
    } catch (dbErr) {
      setError(
        "Unexpected error updating user profile: " + (dbErr.message || dbErr) +
        "\n(See assets/supabase.md for upsert policies and required fields.)"
      );
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
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
        <button className="btn btn-large mt-2" type="submit">
          Sign Up
        </button>
      </form>
      <div style={{ color: "#6b7280", fontSize: "0.95rem", marginTop: 12 }}>
        Already have an account? <a href="/login/citizen" style={{ color: "var(--primary)" }}>Login here</a>
      </div>
    </div>
  );
}
