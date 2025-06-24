/**
 * AuthForm - Use this as a reference for role-based signup/login logic:
 * If user logs in or signs up, after Supabase auth success, always:
 * - Fetch user profile based on user.id
 * - Enforce that the profile role matches the current portal (provided as prop 'role')
 * - If not, log user out (supabase.auth.signOut()), and show error: "This email is registered under a different role."
 * - When signing up: before creating a new account, check if profiles table already has an entry for this email under the opposite role.
 *   If so, block signup and show error.
 * See implementation in LoginCitizenPage.jsx, LoginAuthorityPage.jsx, SignupCitizenPage.jsx, SignupAuthorityPage.jsx.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';


export default function AuthForm({ role, type }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    let result;
    if (type === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });
      if (error) return setError(error.message);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setError(error.message);
    }

    if (role === 'citizen') navigate('/issue-form');
    else navigate('/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleSubmit}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>
          {type === 'signup' ? 'Sign Up' : 'Login'} as {role}
        </h2>
        {error && <p className="text-red-600 error-message">{error}</p>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Password"
        />
        <button type="submit" className="btn btn-large mt-2">{type === 'signup' ? 'Sign Up' : 'Login'}</button>
      </form>
    </div>
  );
}
