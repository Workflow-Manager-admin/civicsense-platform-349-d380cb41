// File: pages/shared/AuthForm.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';

//import { supabase } from '../supabase/supabaseclient';

export default function AuthForm({ role, type }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

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
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
            style={{
              position: "absolute",
              right: 8,
              top: 5,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#C08457"
            }}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <button type="submit" className="btn btn-large mt-2">{type === 'signup' ? 'Sign Up' : 'Login'}</button>
      </form>
    </div>
  );
}
