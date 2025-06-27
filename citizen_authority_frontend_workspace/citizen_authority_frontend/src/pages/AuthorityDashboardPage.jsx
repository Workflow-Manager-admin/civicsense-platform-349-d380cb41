import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

/**
 * AuthorityDashboardPage displays reported civic issues for authority users, including a section/tab to view deleted issues.
 * It allows authorities to view, manage, and "soft" delete issues (using a 'deleted' column).
 */
export default function AuthorityDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [deletedIssues, setDeletedIssues] = useState([]);
  const [tab, setTab] = useState("active"); // "active" or "deleted"
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(""); // id of deleting issue (to show spinner)

  // Fetches non-deleted issues
  const fetchIssues = async () => {
    // Assumes 'deleted' column (boolean) exists; if not, you will need to add it in Supabase
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("deleted", false)
      .order("created_at", { ascending: false });
    if (error) {
      setError("Failed to load issues.");
      setIssues([]);
    } else {
      setIssues(data || []);
    }
  };

  // Fetches deleted issues
  const fetchDeletedIssues = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .eq("deleted", true)
      .order("created_at", { ascending: false });
    if (error) {
      setError("Failed to load deleted issues.");
      setDeletedIssues([]);
    } else {
      setDeletedIssues(data || []);
    }
  };

  // Pull issues on mount and when switching tabs
  useEffect(() => {
    setError("");
    setSuccess("");
    if (tab === "active") {
      fetchIssues();
    } else if (tab === "deleted") {
      fetchDeletedIssues();
    }
    // eslint-disable-next-line
  }, [tab]);

  // PUBLIC_INTERFACE
  /** Soft-delete an issue (set deleted=true) */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this issue? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(id);
    setError("");
    setSuccess("");

    // Soft-delete: set deleted=true
    const { error } = await supabase
      .from("issues")
      .update({ deleted: true })
      .eq("id", id);

    if (error) {
      setError("Failed to delete the issue.");
    } else {
      setSuccess("Issue deleted successfully.");
      await fetchIssues();
    }
    setDeleting("");
  };

  // Tab button UI
  function TabButton({ value, children }) {
    const isSelected = tab === value;
    return (
      <button
        onClick={() => setTab(value)}
        className="btn"
        style={{
          background: isSelected
            ? "var(--success)"
            : "var(--primary-light)",
          color: isSelected
            ? "var(--background)"
            : "var(--text-secondary)",
          fontWeight: isSelected ? 800 : 600,
          border: "2px solid var(--border-color)",
          borderBottom: isSelected
            ? "3.5px solid var(--accent)"
            : "2px solid var(--border-color)",
          borderRadius: "17px 17px 0 0",
          marginRight: "16px",
          marginBottom: "-2px",
          fontSize: "1rem",
          outline: "none",
          outlineOffset: "2px",
        }}
        aria-current={isSelected ? "page" : undefined}
        tabIndex={0}
      >
        {children}
      </button>
    );
  }

  // Main issues table (shared by both tabs)
  function IssuesTable({ data, showDelete }) {
    if (data.length === 0) {
      return <p>No issues found.</p>;
    }
    return (
      <table
        className="table-modern"
        style={{ width: "100%", boxShadow: "var(--shadow)" }}
        aria-label={
          showDelete
            ? "List of reported civic issues"
            : "List of deleted issues"
        }
        role="table"
      >
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Address</th>
            <th scope="col">Category</th>
            <th scope="col">Action</th>
            {showDelete && <th scope="col">Delete</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((issue) => (
            <tr key={issue.id}>
              <td>{issue.name}</td>
              <td>{issue.address}</td>
              <td style={{ textTransform: "capitalize" }}>
                {issue.category}
              </td>
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
                    border: "2px solid var(--border-color)",
                  }}
                  onFocus={e => (e.target.style.outline = "2.5px solid var(--success)")}
                  onBlur={e => (e.target.style.outline = "2px solid transparent")}
                >
                  View Details
                </Link>
              </td>
              {showDelete && (
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
                      cursor: deleting === issue.id ? "not-allowed" : "pointer",
                    }}
                    aria-label={`Delete issue titled ${issue.title}`}
                    onClick={() => handleDelete(issue.id)}
                    disabled={deleting === issue.id}
                  >
                    {deleting === issue.id ? "Deleting..." : "Delete"}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div
      className="container"
      style={{ paddingTop: "48px", paddingBottom: "56px" }}
      aria-label="Authority Dashboard"
    >
      <div
        className="card-bg"
        role="region"
        aria-labelledby="dashboard-heading"
        tabIndex={0}
        style={{ minHeight: 450 }}
      >
        <h2
          id="dashboard-heading"
          className="text-2xl font-bold mb-4"
          style={{
            color: "var(--primary)",
            fontFamily: "Inter, Segoe UI, Arial, sans-serif",
            letterSpacing: "0.01em",
          }}
        >
          Authority Dashboard
        </h2>
        <div style={{ marginBottom: 18 }}>
          <TabButton value="active">All Reported Issues</TabButton>
          <TabButton value="deleted">Deleted Issues</TabButton>
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

        {tab === "active" ? (
          <IssuesTable data={issues} showDelete={true} />
        ) : (
          <IssuesTable data={deletedIssues} showDelete={false} />
        )}
        {tab === "deleted" && deletedIssues.length > 0 && (
          <p style={{ marginTop: 16, color: "var(--text-secondary)", fontSize: "0.99rem" }}>
            These issues have been deleted and are retained for record/audit purposes.
          </p>
        )}
      </div>
    </div>
  );
}
