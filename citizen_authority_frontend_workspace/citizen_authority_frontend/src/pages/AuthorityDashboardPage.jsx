import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

/**
 * AuthorityDashboardPage displays all reported issues and now includes a "Deleted Issues" tab.
 * Soft-deletes are implemented using a "deleted_by_authority" and "deleted_at" field.
 */
export default function AuthorityDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [deletedIssues, setDeletedIssues] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(""); // id of deleting issue (to show spinner if wanted)
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'deleted'

  // Fetch only non-deleted issues
  const fetchIssues = async () => {
    setError("");
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .is("deleted_by_authority", null)
      .order("created_at", { ascending: false });
    if (error) {
      setError("Failed to load issues.");
    } else {
      setIssues(data);
    }
  };

  // Fetch only deleted issues by authorities
  const fetchDeletedIssues = async () => {
    setError("");
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .not("deleted_by_authority", "is", null)
      .order("deleted_at", { ascending: false });
    if (error) {
      setError("Failed to load deleted issues.");
    } else {
      setDeletedIssues(data);
    }
  };

  // On mount/tab change, fetch issues for the current tab
  useEffect(() => {
    if (activeTab === "active") {
      fetchIssues();
    } else {
      fetchDeletedIssues();
    }
    // eslint-disable-next-line
  }, [activeTab]);

  // PUBLIC_INTERFACE
  /** Soft-delete an issue by marking it as deleted in Supabase, not removing the row. */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this issue? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(id);
    setError("");
    setSuccess("");

    // Soft-delete: mark deleted_by_authority and deleted_at
    const { error } = await supabase
      .from("issues")
      .update({
        deleted_by_authority: true,
        deleted_at: new Date().toISOString()
      })
      .eq("id", id);

    if (error) {
      setError("Failed to delete the issue.");
    } else {
      setSuccess("Issue deleted successfully.");
      fetchIssues();
      fetchDeletedIssues();
    }
    setDeleting("");
  };

  // Tab headers component
  const renderTabs = () => (
    <div style={{ marginBottom: "24px", display: "flex", gap: "12px" }}>
      <button
        className={`btn${activeTab === "active" ? " btn-cta" : ""}`}
        style={{
          fontWeight: 800,
          fontSize: "1.08rem",
          borderRadius: "10px",
          outline: activeTab === "active" ? "2.5px solid var(--success)" : "2px solid transparent",
          border: "2px solid var(--border-color)",
          background: activeTab === "active" ? "var(--success)" : "var(--primary-light)",
          color: activeTab === "active" ? "var(--background)" : "var(--text-primary)"
        }}
        onClick={() => setActiveTab("active")}
        aria-current={activeTab === "active" ? "page" : undefined}
      >
        Reported Issues
      </button>
      <button
        className={`btn${activeTab === "deleted" ? " btn-cta" : ""}`}
        style={{
          fontWeight: 800,
          fontSize: "1.08rem",
          borderRadius: "10px",
          outline: activeTab === "deleted" ? "2.5px solid var(--success)" : "2px solid transparent",
          border: "2px solid var(--border-color)",
          background: activeTab === "deleted" ? "var(--success)" : "var(--primary-light)",
          color: activeTab === "deleted" ? "var(--background)" : "var(--text-primary)"
        }}
        onClick={() => setActiveTab("deleted")}
        aria-current={activeTab === "deleted" ? "page" : undefined}
      >
        Deleted Issues
      </button>
    </div>
  );

  // Table rendering for issues and deleted issues
  const renderIssueTable = (data, showDelete = true) => (
    <table
      className="table-modern"
      style={{ width: "100%", boxShadow: "var(--shadow)" }}
      aria-label={showDelete ? "List of reported civic issues" : "List of deleted issues"}
      role="table"
    >
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Address</th>
          <th scope="col">Category</th>
          <th scope="col">Action</th>
          {showDelete && <th scope="col">Delete</th>}
          {!showDelete && <th scope="col">Deleted At</th>}
        </tr>
      </thead>
      <tbody>
        {data.map((issue) => (
          <tr key={issue.id}>
            <td>{issue.name}</td>
            <td>{issue.address}</td>
            <td style={{ textTransform: "capitalize" }}>{issue.category}</td>
            <td>
              <Link
                to={`/issue/${issue.id}`}
                className="btn btn-cta"
                aria-label={`View Details for issue titled ${issue.title}`}
                style={{
                  padding: "7px 20px",
                  fontSize: "1.08rem",
                  borderRadius: "12px",
                  background: "var(--success)",
                  color: "var(--background)",
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "0 2px 10px 0px #A3B18A55",
                  outline: "2px solid transparent",
                  outlineOffset: "2px",
                  border: "2px solid var(--border-color)"
                }}
                onFocus={e => (e.target.style.outline = "2.5px solid var(--success)")}
                onBlur={e => (e.target.style.outline = "2px solid transparent")}
              >
                View Details
              </Link>
            </td>
            {showDelete ? (
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
                    padding: "7px 16px",
                    borderRadius: "12px",
                    marginLeft: "4px",
                    opacity: deleting === issue.id ? 0.65 : 1,
                    cursor: deleting === issue.id ? "not-allowed" : "pointer"
                  }}
                  aria-label={`Delete issue titled ${issue.title}`}
                  onClick={() => handleDelete(issue.id)}
                  disabled={deleting === issue.id}
                >
                  {deleting === issue.id ? "Deleting..." : "Delete"}
                </button>
              </td>
            ) : (
              <td>
                {issue.deleted_at
                  ? new Date(issue.deleted_at).toLocaleString()
                  : "Unknown"}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div
      className="container"
      style={{ paddingTop: "48px", paddingBottom: "56px" }}
      aria-label="Authority Dashboard"
    >
      <div className="card-bg" role="region" aria-labelledby="dashboard-heading" tabIndex={0}>
        <h2
          id="dashboard-heading"
          className="text-2xl font-bold mb-4"
          style={{
            color: "var(--primary)",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            letterSpacing: "0.01em"
          }}
        >
          Authority Dashboard
        </h2>
        {renderTabs()}
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
        {activeTab === "active" ? (
          issues.length === 0 ? (
            <p>No issues found.</p>
          ) : (
            renderIssueTable(issues, true)
          )
        ) : (
          deletedIssues.length === 0 ? (
            <p>No deleted issues found.</p>
          ) : (
            renderIssueTable(deletedIssues, false)
          )
        )}
      </div>
    </div>
  );
}
