import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link, useNavigate } from "react-router-dom";

/**
 * Page for authorities to view all issues where isDeleted is true.
 * Allows authorities to review deleted issues with clear visual distinction.
 *
 * PUBLIC_INTERFACE
 */
export default function DeletedIssuesPage() {
  const [deletedIssues, setDeletedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // PUBLIC_INTERFACE
  /**
   * Fetches all deleted issues (isDeleted === true) from Supabase.
   */
  useEffect(() => {
    const fetchDeletedIssues = async () => {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("isDeleted", true)
        .order("created_at", { ascending: false });

      if (error) {
        setError("Could not fetch deleted issues.");
        setDeletedIssues([]);
      } else {
        setDeletedIssues(data || []);
      }
      setLoading(false);
    };

    fetchDeletedIssues();
  }, []);

  return (
    <div
      className="container"
      style={{ paddingTop: 48, paddingBottom: 52 }}
      aria-label="Deleted Issues Page"
    >
      <div
        className="card-bg"
        role="region"
        aria-labelledby="deleted-issues-heading"
        tabIndex={0}
        style={{
          marginTop: "1.9rem",
          boxShadow: "var(--shadow)",
          border: "1.7px solid var(--error)",
          background: "#fff8f7"
        }}
      >
        <h2
          id="deleted-issues-heading"
          className="text-2xl font-bold mb-3"
          style={{
            color: "var(--error)",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          Deleted Issues
        </h2>
        <p
          className="mb-2"
          style={{ color: "var(--text-secondary)", fontSize: "1.05rem", fontWeight: 500 }}
        >
          All issues marked as deleted are shown below. These are not visible to citizens and cannot be edited.
        </p>
        <button
          className="btn"
          style={{
            background: "var(--primary)",
            color: "var(--background)",
            fontWeight: 700,
            border: "2px solid var(--border-color)",
            borderRadius: "11px",
            fontSize: "1rem",
            marginBottom: "18px",
          }}
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
        {error && (
          <p className="text-red-600 error-message" style={{ marginBottom: 14 }}>{error}</p>
        )}
        {loading ? (
          <p>Loading deleted issues...</p>
        ) : deletedIssues.length === 0 ? (
          <p style={{ color: "#a95252", fontWeight: 500 }}>No deleted issues found.</p>
        ) : (
          <table
            className="table-modern"
            style={{
              width: "100%",
              boxShadow: "var(--shadow)",
              marginTop: "12px",
              border: "1px solid var(--error)"
            }}
            aria-label="Deleted Issues Table"
          >
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Name</th>
                <th scope="col">Category</th>
                <th scope="col">Deleted At</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {deletedIssues.map((issue) => (
                <tr
                  key={issue.id}
                  style={{ background: "#fde7e5", color: "#8b1f09", opacity: 0.86 }}
                >
                  <td>
                    <span style={{ textDecoration: "line-through", fontWeight: 600 }}>
                      {issue.title}
                    </span>
                  </td>
                  <td>{issue.name}</td>
                  <td style={{ textTransform: "capitalize" }}>{issue.category}</td>
                  <td>
                    {/* Use deleted_at or fallback to updated_at/created_at */}
                    <span>
                      {issue.deleted_at
                        ? new Date(issue.deleted_at).toLocaleString()
                        : (issue.updated_at ? new Date(issue.updated_at).toLocaleString() : new Date(issue.created_at).toLocaleString())}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/issue/${issue.id}`}
                      className="btn"
                      style={{
                        background: "var(--error)",
                        color: "var(--background)",
                        fontWeight: 700,
                        outline: "2px solid transparent",
                        outlineOffset: "2px",
                        border: "2px solid var(--border-color)",
                        fontSize: "1rem",
                        borderRadius: "12px",
                        padding: "7px 18px",
                        opacity: 0.75,
                        textDecoration: "line-through",
                        pointerEvents: "none"
                      }}
                      tabIndex={-1}
                      aria-label="View not allowed - deleted"
                      aria-disabled="true"
                    >
                      Deleted
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <style>{`
        .table-modern tr[aria-disabled="true"], .table-modern tr .btn[aria-disabled="true"] {
          opacity: 0.8 !important;
          pointer-events: none !important;
          text-decoration: line-through !important;
        }
      `}
      </style>
    </div>
  );
}
