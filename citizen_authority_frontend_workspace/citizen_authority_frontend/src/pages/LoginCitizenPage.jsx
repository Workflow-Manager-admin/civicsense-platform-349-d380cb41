import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function LoginCitizenPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      return;
    }

    const user = loginData?.user;
    if (!user) {
      setError("Login succeeded but user info is missing.");
      return;
    }

    // 🔍 Step 1: Fetch profile
    let { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // 🧩 Step 2: Upsert citizen role if missing (always provide all required fields, use onConflict: ['id'])
    // IMPORTANT: To comply with RLS (see assets/supabase.md), every upsert to 'profiles' must include:
    //   - id: user.id (from auth)
    //   - email: user.email
    //   - role: 'citizen'
    // Otherwise, the upsert will FAIL if RLS is enabled. Policy:
    //   USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
    if ((!profileData || profileError?.code === 'PGRST116') && user.id && user.email) {
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          [{ id: user.id, email: user.email, role: 'citizen' }],
          { onConflict: ['id'] }
        );
      
      if (upsertError) {
        setError("Failed to upsert citizen profile: " + upsertError.message +
            "\n(See assets/supabase.md for RLS upsert troubleshooting.)");
        return;
      }

      const { data: newProfile, error: newFetchError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (newFetchError || !newProfile) {
        setError("Unable to retrieve role after upserting.");
        return;
      }

      profileData = newProfile;
    }

    // 📝 Step 3: Log login
    await supabase.from('logins').insert([
      { user_id: user.id, role: profileData.role }
    ]);

    // 🚀 Step 4: Redirect
    if (profileData.role === 'citizen') {
      navigate('/issue-form');
    } else if (profileData.role === 'authority') {
      navigate('/dashboard');
    } else {
      setError("Unknown user role.");
    }
  };

  return (
    <div className="container" style={{ maxWidth: "440px", margin: "50px auto", paddingTop: "64px" }}>
      <form className="card-bg" onSubmit={handleLogin}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)" }}>Login as Citizen</h2>
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
          Login
        </button>
      </form>
    </div>
  );
}
