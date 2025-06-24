import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { Link } from 'react-router-dom';

export default function AuthorityDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIssues = async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to load issues.');
      } else {
        setIssues(data);
      }
    };

    fetchIssues();
  }, []);

  return (
    <div className="container" style={{ paddingTop: "48px" }}>
      <div className="card-bg">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--primary)" }}>All Reported Issues</h2>

        {error && <p className="text-red-600">{error}</p>}
        {issues.length === 0 ? (
          <p>No issues found.</p>
        ) : (
          <table className="table-modern" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Category</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.name}</td>
                  <td>{issue.address}</td>
                  <td>{issue.category}</td>
                  <td>
                    <Link
                      to={`/issue/${issue.id}`}
                      className="btn"
                      style={{
                        padding: "7px 16px",
                        fontSize: "0.99rem",
                        borderRadius: "12px",
                        background: "var(--primary)",
                        color: "#fff",
                        fontWeight: 600,
                        textDecoration: "none",
                        boxShadow: "0 2px 10px 0px #ac91e99b"
                      }}
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
