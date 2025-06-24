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
    // Redirect to home page after logout
    navigate("/");
  };

  return (
    <nav className="p-4 bg-gray-200 flex justify-between">
      <Link to="/">Home</Link>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}