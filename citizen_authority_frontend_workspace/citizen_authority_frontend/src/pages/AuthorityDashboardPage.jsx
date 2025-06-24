import { useEffect, useState } from "react";
import { supabase } from "../supabase/supabaseClient";
import { Link } from "react-router-dom";

export default function AuthorityDashboardPage() {
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
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

    fetchIssues();
  }, []);

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
                        background: "var(--accent-green)",
                        color: "#130823",
                        fontWeight: 700,
                        textDecoration: "none",
                        boxShadow: "0 2px 10px 0px #3dee9a45",
                        outline: "2px solid transparent",
                        outlineOffset: "2px"
                      }}
                      onFocus={e => (e.target.style.outline = "2.5px solid var(--accent-green)")}
                      onBlur={e => (e.target.style.outline = "2px solid transparent")}
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
