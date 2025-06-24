import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
/** Delete an issue from Supabase issues table. */
export default function AuthorityDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleting, setDeleting] = useState(""); // id of deleting issue (to show spinner if wanted)

  const fetchIssues = async () => {
    const { data, error } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError("Failed to load issues.");
    } else {
      setIssues(data);
    }
  };

  useEffect(() => {
    fetchIssues();
    // eslint-disable-next-line
  }, []);

  // PUBLIC_INTERFACE
  /** Handle deleting an issue */
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this issue? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setDeleting(id);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("issues")
      .delete()
      .eq("id", id);

    if (error) {
      setError("Failed to delete the issue.");
    } else {
      setSuccess("Issue deleted successfully.");
      await fetchIssues();
    }
    setDeleting("");
  };

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
          All Reported Issues
        </h2>
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
        )}
      </div>
    </div>
  );
}
