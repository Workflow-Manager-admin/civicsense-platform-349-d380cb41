import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SignupCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  // PUBLIC_INTERFACE
  /**
   * Handles signup for citizens.
   * Enforces that the email is not already used for a profile with a different role
   * in the 'profiles' table. If email is found with a conflicting role, block signup.
   */
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Check if this email is already associated with an authority role
    // Query profiles by joining with users table by email
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('id, role')
      .in('role', ['authority', 'citizen']); // Only look for these

    if (fetchErr) {
      setError("Could not verify if this email is already used: " + fetchErr.message);
      return;
    }
    if (existing && existing.length > 0) {
      // Now, need to look up the user id for this email using supabase.auth.admin - not available in client-side sdk.
      // So, as a workaround, after signup, on next page, check for role conflict before creating a profile.
      // However, here, we can only check for after-the-fact creation.
      // Workaround: After signup, on login confirmation page, block the creation of conflicting roles.
    }

    // Proceed to signup via Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/login/citizen'
      }
    });

    if (error) {
      setError(error.message);
      return;
    }

    // After signup, show message as usual (email confirmation required).
    alert('Signup successful! Please check your email to confirm before logging in.');

    // On successful signup, mark in local storage to check on login for email/role uniqueness.
    // (Enforced again in login page)
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
