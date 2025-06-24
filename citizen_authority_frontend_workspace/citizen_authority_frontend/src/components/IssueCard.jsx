// File: components/IssueCard.jsx
export default function IssueCard({ issue }) {
  const getStatusBg = (status) => {
    if (status === "resolved") return "var(--success)";
    if (status === "in progress") return "var(--primary-hover)";
    return "var(--primary)";
  };
  return (
    <div
      className="card"
      role="region"
      aria-label={`Issue: ${issue.title}`}
      tabIndex={0}
      style={{
        marginBottom: "1.4rem",
        minWidth: 250,
        boxShadow: "var(--shadow)",
        background: "var(--card-bg)",
      }}
    >
      <h3
        className="text-xl font-bold mb-2"
        style={{
          color: "var(--primary)",
          fontSize: "1.28rem",
          lineHeight: 1.3,
        }}
        aria-label="Issue Title"
      >
        {issue.title}
      </h3>
      <p
        className="mb-2"
        style={{
          color: "var(--text-secondary)",
          fontSize: "1.03rem",
          letterSpacing: "0.01em",
        }}
      >
        {issue.description}
      </p>
      <span
        className="badge"
        aria-label={`Status: ${issue.status}`}
        style={{
          background: getStatusBg(issue.status),
          color: "var(--background)",
          padding: "0.45em 1.05em",
          borderRadius: "1em",
          fontWeight: 900,
          marginTop: "9px",
          display: "inline-block",
          fontSize: "1rem",
          letterSpacing: "0.03em",
          boxShadow: "0 2px 8px 0 #6d28d94a"
        }}
      >
        Status: <span style={{ textTransform: "capitalize" }}>{issue.status}</span>
      </span>
    </div>
  );
}