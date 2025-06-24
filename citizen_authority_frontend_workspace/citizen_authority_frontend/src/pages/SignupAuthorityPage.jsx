import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function SignupAuthorityPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'http://localhost:3000/login/authority' // redirect link after confirmation
      }
    });

    if (error) {
      setError("Database error saving new user: " + error.message);
    } else {
      alert('Signup successful! Please check your email to confirm your account before logging in.');
      navigate('/login/authority');
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
