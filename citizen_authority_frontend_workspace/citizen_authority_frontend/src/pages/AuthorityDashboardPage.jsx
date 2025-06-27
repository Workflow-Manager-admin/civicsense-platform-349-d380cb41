import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
/** Authority dashboard with deleted issues view. */
export default function AuthorityDashboardPage() {
  const [activeTab, setActiveTab] = useState("active");
  const [issues, setIssues] = useState([]);
  const [deletedIssues, setDeletedIssues] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(""); // id of deleting issue

  // Fetches active (non-deleted) issues
  // Note: Assumes issues table will have "is_deleted" flag for soft delete.
  const fetchIssues = async () => {
    setError("");
    // Fetch all issues where is_deleted IS NOT true (or is_deleted does not exist)
    let { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load issues.");
      setIssues([]);
    } else {
      // Split "deleted" and "active" issues by `is_deleted`, if such a column exists
      // If not, explain to the user below
      if (data.some(d => typeof d.is_deleted !== "undefined")) {
        setIssues(data.filter(d => !d.is_deleted));
        setDeletedIssues(data.filter(d => d.is_deleted));
      } else {
        setIssues(data);
        setDeletedIssues(undefined); // undefined means: Soft delete not supported.
      }
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line
  }, []);

  // PUBLIC_INTERFACE
  /** Handle deleting an issue - soft-delete if supported, else hard-delete. */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this issue? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(id);
    setError("");
    setSuccess("");

    let error;
    // Try to soft-delete by setting is_deleted to true. If not allowed/fails, fallback to hard delete.
    const { error: updateErr } = await supabase
      .from("issues")
      .update({ is_deleted: true })
      .eq("id", id);
    if (updateErr && (updateErr.code === "42703" || /column "is_deleted"/.test(updateErr.message))) {
      // If "is_deleted" column error, fallback to hard delete
      const { error: delErr } = await supabase
        .from("issues")
        .delete()
        .eq("id", id);
      error = delErr;
    } else {
      error = updateErr;
    }

    if (error) {
      setError("Failed to delete the issue (soft-delete not supported or DB error).");
    } else {
      setSuccess("Issue deleted successfully.");
      await fetchIssues();
    }
    setDeleting("");
  };

  // Tab Content Selectors
  const ActiveContent = () => (
    issues.length === 0 ? (
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
            <th scope="col">Action</th>
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
            </tr>
          ))}
        </tbody>
      </table>
    )
  );

  // Deleted Issues Tab Content - only shown if soft-delete is supported
  const DeletedContent = () => !deletedIssues
    ? (
      <div style={{ background: "#fffbe9", padding: "1rem 1.5rem", borderRadius: 12, color: "#775012", margin: "1.2rem 0" }}>
        <b>Note:</b> Soft-deletion is not enabled in the issues table. Deleted issues are permanently removed and cannot be viewed here.<br />
        To enable this feature: Add a boolean <b>is_deleted</b> column to your Supabase <b>issues</b> table and use soft-deletion in your API/UI.
      </div>
    )
    : (deletedIssues.length === 0 ? (
      <p>No deleted issues found.</p>
    ) : (
      <table
        className="table-modern"
        style={{
          width: "100%",
          boxShadow: "var(--shadow)",
          background: "#faf8f6"
        }}
        aria-label="List of deleted civic issues"
        role="table"
      >
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Address</th>
            <th scope="col">Category</th>
            <th scope="col">Deleted On</th>
          </tr>
        </thead>
        <tbody>
          {deletedIssues.map(issue => (
            <tr key={issue.id}>
              <td>{issue.name}</td>
              <td>{issue.address}</td>
              <td style={{ textTransform: "capitalize" }}>{issue.category}</td>
              <td>
                {issue.updated_at
                  ? new Date(issue.updated_at).toLocaleString()
                  : "—"
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ));

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

        {/* Tab selector */}
        <div style={{
          display: "flex",
          gap: "1.2rem",
          marginBottom: "2rem",
          alignItems: "center"
        }}>
          <button
            className={`btn${activeTab === "active" ? " btn-cta" : ""}`}
            style={{
              background: activeTab === "active" ? "var(--success)" : "var(--primary)",
              color: "var(--background)",
              border: "2px solid var(--border-color)",
              borderRadius: "12px",
              fontWeight: 700,
              outline: activeTab === "active" ? "2.5px solid var(--success)" : "2px solid transparent",
              outlineOffset: "2px",
              padding: "8px 28px",
              fontSize: "1rem"
            }}
            onClick={() => setActiveTab("active")}
            aria-pressed={activeTab === "active"}
          >
            All Active Issues
          </button>
          <button
            className={`btn${activeTab === "deleted" ? " btn-cta" : ""}`}
            style={{
              background: activeTab === "deleted" ? "var(--error)" : "var(--primary-light)",
              color: activeTab === "deleted" ? "var(--background)" : "var(--error)",
              border: "2px solid var(--border-color)",
              borderRadius: "12px",
              fontWeight: 700,
              outline: activeTab === "deleted" ? "2.5px solid var(--error)" : "2px solid transparent",
              outlineOffset: "2px",
              padding: "8px 28px",
              fontSize: "1rem"
            }}
            onClick={() => setActiveTab("deleted")}
            aria-pressed={activeTab === "deleted"}
          >
            Deleted Issues
          </button>
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

        {activeTab === "active" && <ActiveContent />}
        {activeTab === "deleted" && <DeletedContent />}
      </div>
    </div>
  );
}
