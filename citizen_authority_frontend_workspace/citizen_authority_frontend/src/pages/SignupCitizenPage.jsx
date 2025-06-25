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
   * - On successful registration, creates/updates the user record in the 'profiles' table with role 'citizen'.
   * - Provides error feedback for both auth and profiles insertion.
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Register user with Supabase Auth
    const { data, error: signupError } = await supabase.auth.signUp({
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

    // In some cases, Supabase will not return user object until email is confirmed.
    // Inform user if confirmation required
    const user = data?.user;
    if (!user) {
      alert(
        "Signup successful! Please check your email to confirm before logging in."
      );
      navigate('/login/citizen');
      return;
    }

    // 2. Upsert role into 'profiles' table
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{ id: user.id, email, role: 'citizen' }], { onConflict: ['id'] });

      if (profileError) {
        setError(
          "Database error saving new user profile: " + profileError.message
        );
        return;
      }
    } catch (dbErr) {
      setError(
        "Unexpected error updating user profile: " + (dbErr.message || dbErr)
      );
      return;
    }
    alert(
      'Signup successful! Please check your email to confirm before logging in.'
    );
    navigate('/login/citizen');
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
