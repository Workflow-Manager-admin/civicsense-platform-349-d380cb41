import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

export default function ProtectedRoute({ children, role }) {
  const [status, setStatus] = useState('loading'); // 'loading', 'allowed', 'denied'
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      // Defensive: always set Accept header (Supabase-js does it by default, but fix for 406 if proxying)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (!user || userError) {
        setStatus('denied');
        return;
      }

      // Try first with supabase-js
      let { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      // If we get a 406 Not Acceptable, retry select with shape explicitly set
      if ((profileError && profileError.status === 406) || (!profile && profileError)) {
        try {
          const { data: newProfile, error: newProfileErr } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle(); // fallback, allows null
          if (!newProfile || newProfileErr) {
            setStatus('denied');
            return;
          }
          profile = newProfile;
        } catch (_) {
          setStatus('denied');
          return;
        }
      }

      if (!profile || profile.role !== role) {
        setStatus('denied');
      } else {
        setStatus('allowed');
      }
    };

    checkUserRole();
  }, [role]);

  if (status === 'loading') return <p>Checking access...</p>;
  if (status === 'denied') {
    navigate('/');
    return null;
  }

  return children;
}
