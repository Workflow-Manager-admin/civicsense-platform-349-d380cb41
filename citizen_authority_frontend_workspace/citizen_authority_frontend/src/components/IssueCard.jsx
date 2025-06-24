// File: components/IssueCard.jsx
export default function IssueCard({ issue }) {
  return (
    <div
      className="card"
      role="region"
      aria-label={`Issue: ${issue.title}`}
      tabIndex={0}
      style={{ marginBottom: "1.4rem", minWidth: 250, boxShadow: "var(--shadow)" }}
    >
      <h3
        className="text-xl font-bold mb-2"
        style={{ color: "var(--highlight)", fontSize: "1.28rem", lineHeight: 1.3 }}
        aria-label="Issue Title"
      >
        {issue.title}
      </h3>
      <p
        className="mb-2"
        style={{ color: "var(--text-secondary)", fontSize: "1.03rem", letterSpacing: "0.01em" }}
      >
        {issue.description}
      </p>
      <span
        className="badge"
        aria-label={`Status: ${issue.status}`}
        style={{
          background:
            issue.status === "resolved"
              ? "var(--accent-green)"
              : issue.status === "in progress"
              ? "var(--accent-yellow)"
              : "var(--accent)",
          color: "#1b1932",
          padding: "0.45em 1.05em",
          borderRadius: "1em",
          fontWeight: 900,
          marginTop: "9px",
          display: "inline-block",
          fontSize: "1rem",
          letterSpacing: "0.03em",
          boxShadow: "0 2px 8px 0 #06d6a022"
        }}
      >
        Status: <span style={{ textTransform: "capitalize" }}>{issue.status}</span>
      </span>
    </div>
  );
}