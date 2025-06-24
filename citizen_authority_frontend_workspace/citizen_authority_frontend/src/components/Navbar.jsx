// File: components/Navbar.jsx
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient'; // CORRECT

import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  // PUBLIC_INTERFACE
  /**
   * Logs the user out using Supabase and redirects to the home page.
   */
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <span className="logo-symbol" aria-label="CivicFlow Brand">⚡</span>
        CivicFlow
      </div>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        <Link className="btn" to="/">Home</Link>
        <button className="btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}