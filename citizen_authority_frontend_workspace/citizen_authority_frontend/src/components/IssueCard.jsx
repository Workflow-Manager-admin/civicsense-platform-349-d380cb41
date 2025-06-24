// File: components/IssueCard.jsx
export default function IssueCard({ issue }) {
  return (
    <div className="card">
      <h3 className="text-xl font-bold mb-2" style={{ color: "var(--highlight)" }}>{issue.title}</h3>
      <p className="mb-2" style={{ color: "var(--text-secondary)" }}>{issue.description}</p>
      <span className="badge" style={{
        background: "var(--button)",
        color: "var(--accent)",
        padding: "0.25em 0.85em",
        borderRadius: "1em",
        fontWeight: 600,
        marginTop: "6px",
        display: "inline-block"
      }}>
        Status: {issue.status}
      </span>
    </div>
  );
}