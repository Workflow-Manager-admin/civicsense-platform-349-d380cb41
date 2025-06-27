import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

/**
 * Authority dashboard: lists civic issues, allows viewing details and deleting issues.
 * Deletion gives visual feedback and removes the issue from the list on success.
 * Connects to Supabase backend. UI updates reflect real-time changes after deletion.
 */
// PUBLIC_INTERFACE
export default function AuthorityDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(""); // id of deleting issue
  const [snackbar, setSnackbar] = useState({ open: false, msg: "" });

  // PUBLIC_INTERFACE
  /** Fetch all issues for display; used after successful delete as well. */
  const fetchIssues = async () => {
    setError("");
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load issues.");
      setIssues([]);
    } else {
      setIssues(data);
      setSuccess("");
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line
  }, []);

  // PUBLIC_INTERFACE
  /** Handle deleting an issue and update table with confirmation. */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this issue? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(id);
    setError("");
    setSuccess("");

    // Soft delete: set deleted=true, deleted_at=now()
    const { error } = await supabase
      .from("issues")
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      setError("Failed to delete the issue.");
      setDeleting("");
      return;
    } else {
      // Instead of only local filter, always fetch current issues
      setSnackbar({ open: true, msg: "Issue deleted successfully (moved to deleted)." });
      setSuccess("");
      setError("");
      setDeleting("");
      await fetchIssues();
      // Dispatch a custom event to signal deleted-issues list to refresh
      window.dispatchEvent(new Event('civicsoft_issues_updated'));
    }
  };

  // Auto-hide the snackbar/toast after 2s
  useEffect(() => {
    if (snackbar.open) {
      const timer = setTimeout(() => {
        setSnackbar({ open: false, msg: "" });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [snackbar.open]);

  return (
    <div
      className="container"
      style={{ paddingTop: "48px", paddingBottom: "56px" }}
      aria-label="Authority Dashboard"
    >
      <div className="card-bg" role="region" aria-labelledby="dashboard-heading" tabIndex={0}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
          <h2
            id="dashboard-heading"
            className="text-2xl font-bold mb-4"
            style={{
              color: "var(--primary)",
              fontFamily: "Inter, Segoe UI, Arial, sans-serif",
              letterSpacing: "0.01em"
            }}
          >
            All Reported Issues
          </h2>
          <Link
            to="/deleted-issues"
            className="btn"
            style={{
              background: "var(--error)",
              color: "var(--background)",
              fontWeight: 700,
              border: "2px solid var(--border-color)",
              fontSize: "1.02rem",
              borderRadius: 10,
              padding: "9px 18px",
              textDecoration: "none"
            }}
            aria-label="View deleted issues"
          >
            View Deleted Issues
          </Link>
        </div>
        {error && (
          <p className="text-red-600" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-600 success-message" role="status">
            {success}
          </p>
        )}
        {snackbar.open && (
          <div
            style={{
              position: "fixed",
              bottom: 22,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--success)",
              color: "var(--primary-dark)",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: "1.04rem",
              zIndex: 2000,
              padding: "12px 34px",
              boxShadow: "0 3px 12px 0 rgba(80,200,120,0.19)",
              border: "2px solid var(--accent-green)" 
            }}
            aria-live="polite"
            role="status"
          >
            {snackbar.msg}
          </div>
        )}
        {issues.length === 0 ? (
          <p>No issues found.</p>
        ) : (
          <table
            className="table-modern"
            style={{ width: "100%", boxShadow: "var(--shadow)" }}
            aria-label="List of reported civic issues"
            role="table"
          >
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Address</th>
                <th scope="col">Category</th>
                <th scope="col">View</th>
                <th scope="col">Delete</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id}>
                  <td>{issue.name}</td>
                  <td>{issue.address}</td>
                  <td style={{ textTransform: "capitalize" }}>{issue.category}</td>
                  <td>
                    <Link
                      to={`/issue/${issue.id}`}
                      className="btn btn-cta"
                      aria-label={`View details for issue titled ${issue.title}`}
                      title="View this issue"
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
                        minWidth: "82px"
                      }}
                      onFocus={e => (e.target.style.outline = "2.5px solid var(--success)")}
                      onBlur={e => (e.target.style.outline = "2px solid transparent")}
                    >
                      <span role="img" aria-label="View" style={{fontSize:"1.15em"}}>👁️</span> View
                    </Link>
                  </td>
                  <td>
                    <button
                      className="btn"
                      style={{
                        background: "var(--error)",
                        color: "var(--background)",
                        fontWeight: 700,
                        outline: "2px solid transparent",
                        outlineOffset: "2px",
                        border: "2px solid var(--border-color)",
                        padding: "7px 13px",
                        borderRadius: "12px",
                        marginLeft: "4px",
                        opacity: deleting === issue.id ? 0.65 : 1,
                        cursor: deleting === issue.id ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        minWidth: "80px",
                        justifyContent: "center"
                      }}
                      aria-label={`Delete issue titled ${issue.title}`}
                      title="Delete this issue"
                      onClick={() => handleDelete(issue.id)}
                      disabled={deleting === issue.id}
                      onFocus={e => (e.target.style.outline = "2.5px solid var(--error)")}
                      onBlur={e => (e.target.style.outline = "2px solid transparent")}
                    >
                      <span role="img" aria-label="Delete" style={{fontSize:"1.18em"}}>🗑️</span>
                      {deleting === issue.id ? "Deleting..." : "Delete"}
                    </button>
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
