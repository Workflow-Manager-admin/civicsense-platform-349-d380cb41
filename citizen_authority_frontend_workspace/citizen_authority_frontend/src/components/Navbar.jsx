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
    <nav
      className="navbar"
      aria-label="Main Navigation"
      role="navigation"
      tabIndex={0}
      style={{ boxShadow: "var(--shadow)" }}
    >
      <div className="logo" tabIndex={0} aria-label="CivicFlow home brand">
        <span
          className="logo-symbol"
          aria-label="CivicFlow Brand"
          style={{ color: "var(--highlight)", fontSize: "2rem" }}
        >⚡</span>
        <span style={{ color: "var(--accent)", fontWeight: 900, fontFamily: 'Inter, Segoe UI, Arial, sans-serif', letterSpacing: "0.01em", fontSize: "1.28rem" }}>
          CivicFlow
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center"
        }}
      >
        <Link
          className="btn"
          tabIndex={0}
          to="/"
          aria-label="Go to Home"
          style={{
            outline: "2px solid transparent",
            outlineOffset: "2px"
          }}
          onFocus={e => e.target.style.outline = "2px solid var(--accent)"}
          onBlur={e => e.target.style.outline = "2px solid transparent"}
        >
          Home
        </Link>
        <button
          className="btn"
          onClick={handleLogout}
          aria-label="Logout"
          style={{
            outline: "2px solid transparent",
            outlineOffset: "2px"
          }}
          onFocus={e => e.target.style.outline = "2px solid var(--danger)"}
          onBlur={e => e.target.style.outline = "2px solid transparent"}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}