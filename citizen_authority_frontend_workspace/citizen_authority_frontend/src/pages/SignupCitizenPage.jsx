import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

/**
 * Signup page for citizens.
 * Handles creation of auth account and profile role in Supabase.
 */
export default function SignupCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  /**
   * Handles the signup process for a new citizen:
   * - Registers user with Supabase Auth.
   * - PROVIDES A SAFE UP-SERT LOGIC for the profile:
   *   - Only attempts upsert if a valid user object with id and email is returned (i.e., after confirmation for providers that require it).
   *   - Otherwise, notifies user to confirm their account and advises login after confirmation, per Supabase recommended flow.
   * - Prevents broken upserts that trigger RLS or constraint errors.
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Register user with Supabase Auth
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

    // Supabase will (by default) ONLY return a user immediately for some providers,
    // otherwise only after email confirmation. For initial signups, often user is null.
    const user = signupData?.user;

    if (!user || !user.id || !user.email) {
      // No insert into profiles at this stage; wait for login with confirmed email.
      alert(
        "Signup successful! Please check your email to confirm your account. After confirmation, log in to complete registration."
      );
      navigate('/login/citizen');
      return;
    }

    // After confirmation (user object present), upsert profile row
    try {
      // Full upsert with required fields, DO NOT attempt without all info
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          [{ id: user.id, email: user.email, role: 'citizen' }],
          { onConflict: ['id'] }
        );

      if (profileError) {
        setError(
          "Database error saving new user profile: " + profileError.message
        );
        return;
      }

      alert(
        'Signup successful! Profile created. Please check your email to confirm, then log in.'
      );
      navigate('/login/citizen');
    } catch (dbErr) {
      setError(
        "Unexpected error updating user profile: " + (dbErr.message || dbErr)
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
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-large mt-2" type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
}
