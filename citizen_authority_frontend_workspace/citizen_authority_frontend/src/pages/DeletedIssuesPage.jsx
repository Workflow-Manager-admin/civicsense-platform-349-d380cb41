import React, { useEffect, useState } from "react";
import IssueCard from "../components/IssueCard";
import Spinner from "../components/Spinner";

/**
 * DeletedIssuesPage
 * -----------------
 * Fetches and displays issues deleted by an authority (isDeleted=true and deletedBy='authority')
 * by calling the backend /issues/deleted endpoint.
 */
const DeletedIssuesPage = () => {
  const [deletedIssues, setDeletedIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // PUBLIC_INTERFACE
    // Fetches authority-deleted issues from backend
    const fetchDeletedIssues = async () => {
      setLoading(true);
      try {
        // NOTE: Change URL to match backend endpoint: '/issues/deleted'
        // If running in development/relative API proxying, ensure correct base path
        const response = await fetch("/issues/deleted", {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch deleted issues");
        }
        // Expecting array of authority-deleted issues
        const data = await response.json();
        // Defensive: If backend returns issues:{...}, accept that as well
        let issues = Array.isArray(data) ? data : data.issues;
        if (!Array.isArray(issues)) {
          issues = [];
        }
        // (Optional) Further filter client-side to enforce only authority-deleted
        // issues, in case backend filtering logic changes.
        const authorityDeletedIssues = issues.filter(
          (issue) => issue.isDeleted === true && issue.deletedBy === "authority"
        );
        setDeletedIssues(authorityDeletedIssues);
      } catch (error) {
        setDeletedIssues([]);
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
        <p>No authority-deleted issues found.</p>
      )}
    </div>
  );
};

export default DeletedIssuesPage;
