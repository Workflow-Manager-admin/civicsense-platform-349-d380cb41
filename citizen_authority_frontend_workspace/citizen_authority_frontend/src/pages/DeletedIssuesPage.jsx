import React, { useEffect, useState } from "react";
import IssueCard from "../components/IssueCard";
import Spinner from "../components/Spinner";

/**
 * DeletedIssuesPage
 * -----------------
 * Fetches and displays issues deleted by an authority (isDeleted=true and deletedBy='authority')
 * by calling the backend /issues/deleted endpoint.
 * Also displays backend payload and error details if no data renders for debugging.
 */
// PUBLIC_INTERFACE
const DeletedIssuesPage = () => {
  const [deletedIssues, setDeletedIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rawPayload, setRawPayload] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // PUBLIC_INTERFACE
    // Fetches authority-deleted issues from backend, with flexible mapping/diagnostics
    const fetchDeletedIssues = async () => {
      setLoading(true);
      setError("");
      try {
        // Change URL to match backend endpoint: '/issues/deleted'
        const response = await fetch("/issues/deleted", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch deleted issues. Status ${response.status}`);
        }
        // Accept both array and object response (e.g. { issues: [...] } or [...])
        const data = await response.json();
        setRawPayload(data);
        let issues;
        if (Array.isArray(data)) {
          issues = data;
        } else if (data && Array.isArray(data.issues)) {
          issues = data.issues;
        } else if (data && data.data && Array.isArray(data.data)) {
          // Accept common alternate envelope {data: [...]}
          issues = data.data;
        } else {
          issues = [];
        }
        // Defensive: Accept all key naming cases for isDeleted and deletedBy
        const authorityDeletedIssues = issues.filter((issue) => {
          // Accept both camelCase and snake_case from backend (project sometimes mixes these)
          const isDeleted =
            issue.isDeleted === true ||
            issue.is_deleted === true;
          const deletedBy =
            issue.deletedBy === "authority" ||
            issue.deleted_by === "authority";
          return isDeleted && deletedBy;
        });
        setDeletedIssues(authorityDeletedIssues);
        if (authorityDeletedIssues.length === 0) {
          setError(
            "No authority-deleted issues found from backend after filtering. " +
            "Raw payload is shown below for debugging. " +
            "Check backend data keys, especially isDeleted and deletedBy/case."
          );
        }
      } catch (error) {
        setDeletedIssues([]);
        setError(
          "Error fetching deleted issues: " +
            (error && error.message ? error.message : String(error))
        );
      } finally {
        setLoading(false);
      }
    };
    fetchDeletedIssues();
  }, []);

  return (
    <div className="container my-4">
      <h2>Deleted Issues</h2>
      {loading ? (
        <Spinner />
      ) : deletedIssues.length > 0 ? (
        <div className="row">
          {deletedIssues.map((issue) => (
            <div className="col-md-6 col-lg-4 mb-3" key={issue.id}>
              <IssueCard issue={issue} showDeleted />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <p style={{ color: "var(--error)", fontWeight: 600 }}>
            {error || "No authority-deleted issues found."}
          </p>
          <details style={{
            marginTop: 8,
            fontFamily: "monospace",
            color: "#555",
            background: "#FAFAF7",
            border: "1px solid #E5E7EB",
            borderRadius: 6,
            padding: 10
          }}>
            <summary>Show API backend response for debugging</summary>
            <pre
              style={{ overflowX: "auto", fontSize: "0.97rem" }}
              aria-label="Raw backend response"
            >
              {JSON.stringify(rawPayload, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default DeletedIssuesPage;
