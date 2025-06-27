import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

/**
 * DeletedIssuesPage: Shows all issues flagged as "deleted" (soft-delete pattern).
 * Only visible to authorities (from dashboard tab/section).
 * Fetches only issues where deleted=true or deleted_at IS NOT NULL.
 * To support upgrading to live soft-delete backend, this frontend can filter locally or fetch as appropriate.
 */
// PUBLIC_INTERFACE
export default function DeletedIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // PUBLIC_INTERFACE
  /** Fetch all issues that have been soft-deleted (deleted=true OR deleted_at exists) */
  const fetchDeletedIssues = async () => {
    setError("");
    setLoading(true);

    // Recommended soft-delete search: deleted=true or deleted_at not null
    // For demo/migration (if soft-delete not implemented backend-side), fallback: show none.
    let { data, error } = await supabase
      .from("issues")
      .select("*")
      .or("deleted.eq.true,deleted_at.not.is.null") // matches either 'deleted' flag or 'deleted_at' timestamp
      .order("deleted_at", { ascending: false }); // most recently deleted first

    if (error && error.code === "PGRST102") {
      // If .or or column not found, fetch all and filter on frontend
      ({ data, error } = await supabase.from("issues").select("*"));
      if (!error) {
        data = data.filter(
          (issue) => issue.deleted === true || !!issue.deleted_at
        );
      }
    }

    if (error) {
      setError("Failed to load deleted issues.");
      setIssues([]);
    } else {
      setIssues(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDeletedIssues();

    // Listen for events dispatched from elsewhere indicating deleted issues should refresh
    function handleIssuesUpdated() {
      fetchDeletedIssues();
    }
    window.addEventListener('civicsoft_issues_updated', handleIssuesUpdated);
    return () => {
      window.removeEventListener('civicsoft_issues_updated', handleIssuesUpdated);
    };
    // eslint-disable-next-line
  }, []);

  return (
    <div
      className="container"
      style={{ paddingTop: "48px", paddingBottom: "56px" }}
      aria-label="Deleted Issues"
    >
      <div
        className="card-bg"
        role="region"
        aria-labelledby="deleted-issues-heading"
        tabIndex={0}
      >
        <h2
          id="deleted-issues-heading"
          className="text-2xl font-bold mb-4"
          style={{
            color: "var(--error)",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          Deleted Issues
        </h2>
        {error && (
          <p className="text-red-600" role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p>Loading deleted issues...</p>
        ) : issues.length === 0 ? (
          <p>No deleted issues found.</p>
        ) : (
          <table
            className="table-modern"
            style={{ width: "100%", boxShadow: "var(--shadow)" }}
            aria-label="List of deleted issues"
            role="table"
          >
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Deleted At</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.title}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {issue.category}
                  </td>
                  <td>
                    {issue.deleted_at
                      ? new Date(issue.deleted_at).toLocaleString()
                      : "—"}
                  </td>
                  <td>
                    <Link
                      to={`/issue/${issue.id}?deleted=1`}
                      className="btn btn-cta"
                      aria-label={`View details for deleted issue titled ${issue.title}`}
                      title="View deleted issue details"
                      style={{
                        padding: "7px 16px",
                        fontSize: "1.06rem",
                        borderRadius: "12px",
                        background: "var(--success)",
                        color: "var(--background)",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 10px 0px #A3B18A55",
                        outline: "2px solid transparent",
                        outlineOffset: "2px",
                        border: "2px solid var(--border-color)",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        justifyContent: "center",
                        minWidth: "82px",
                      }}
                      onFocus={(e) =>
                        (e.target.style.outline = "2.5px solid var(--success)")
                      }
                      onBlur={(e) =>
                        (e.target.style.outline = "2px solid transparent")
                      }
                    >
                      <span role="img" aria-label="View" style={{ fontSize: "1.15em" }}>
                        👁️
                      </span>{" "}
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div style={{ marginTop: 28 }}>
          <Link
            to="/dashboard"
            className="btn"
            style={{
              background: "var(--primary)",
              color: "var(--background)",
              fontWeight: 700,
              border: "2px solid var(--border-color)",
              fontSize: "1.05rem",
              borderRadius: 10,
              padding: "10px 26px",
              textDecoration: "none",
              marginTop: 10,
              display: "inline-block",
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
