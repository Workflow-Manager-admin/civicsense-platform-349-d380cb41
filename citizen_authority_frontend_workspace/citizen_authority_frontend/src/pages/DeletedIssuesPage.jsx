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
      const fetchUrl = "/issues/deleted"; // You may need to change this to full URL if proxied or deployed elsewhere
      let errorDetails = {
        url: fetchUrl,
        status: null,
        statusText: null,
        errorBody: null,
        exception: null,
      };

      try {
        // Log the actual fetch URL for developer awareness
        console.log(`[DeletedIssuesPage] Fetching deleted issues from: ${fetchUrl}`);

        const response = await fetch(fetchUrl, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        
        if (!response.ok) {
          errorDetails.status = response.status;
          errorDetails.statusText = response.statusText;

          // Try to get detail from backend (text OR JSON)
          let backendDetail;
          try {
            // Some backends return error text, not JSON, on 404/500
            backendDetail = await response.text();
            // Try to parse as JSON, but fallback to plain text
            try {
              const jsonMaybe = JSON.parse(backendDetail);
              backendDetail = JSON.stringify(jsonMaybe, null, 2);
            } catch (jsonErr) {
              // It's plain text; just show as is
            }
          } catch (errText) {
            backendDetail = `[Failed to read response text: ${String(errText)}]`;
          }
          errorDetails.errorBody = backendDetail;

          throw new Error(
            `Failed to fetch deleted issues.\nStatus ${response.status} ${response.statusText}\n${backendDetail}`
          );
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
        // Try to show as much diagnostic as possible
        errorDetails.exception = error && error.stack ? error.stack : String(error);
        setError(
          "Error fetching deleted issues.\n" +
            `Fetch URL: ${errorDetails.url}\n` +
            (errorDetails.status !== null
              ? `Status: ${errorDetails.status} ${errorDetails.statusText}\n`
              : "") +
            (errorDetails.errorBody
              ? `Backend error/detail: ${errorDetails.errorBody}\n`
              : "") +
            `Exception details: ${errorDetails.exception}\n` +
            "Please retry and provide this output to your developer or API backend maintainer."
        );
        setRawPayload(null); // Hide previous payload on fetch error
        console.error("DeletedIssuesPage debug diagnostic:", errorDetails);
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
          <p style={{ color: "var(--error)", fontWeight: 600, whiteSpace: "pre-wrap" }}>
            {error || "No authority-deleted issues found."}
          </p>
          <div style={{
            margin: "12px 0 10px 0",
            color: "#444",
            background: "#F4F4FA",
            border: "1px solid #EBE6EE",
            borderRadius: 6,
            padding: 8,
            fontSize: "0.98rem"
          }}>
            <strong>🩺 If you see detailed info below, copy it and share with your backend/API maintainer!</strong>
          </div>
          <details style={{
            marginTop: 8,
            fontFamily: "monospace",
            color: "#555",
            background: "#FAFAF7",
            border: "1px solid #E5E7EB",
            borderRadius: 6,
            padding: 10
          }}>
            <summary>Show API backend response & diagnostics</summary>
            <pre
              style={{ overflowX: "auto", fontSize: "0.97rem" }}
              aria-label="Raw backend response or diagnostic"
            >
              {rawPayload
                ? JSON.stringify(rawPayload, null, 2)
                : "No backend payload. See error above for details.\n"}
            </pre>
          </details>
          <div style={{ marginTop: 16, color: "#2947a1", fontSize: "0.98rem" }}>
            <b>What to try:</b>
            <ol style={{ margin: "6px 0 6px 21px" }}>
              <li>Check the fetch URL and backend error shown above.</li>
              <li>Ensure the backend is running, and that the endpoint matches exactly.</li>
              <li>Retry or reload. If the issue persists, send the above diagnostics to your developer.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedIssuesPage;
