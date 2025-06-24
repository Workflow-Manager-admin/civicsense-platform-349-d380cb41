import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import axios from 'axios';

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [issue, setIssue] = useState(null);
  const [summary, setSummary] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Fetch error:', error.message);
        setError("Failed to fetch issue details.");
      } else {
        setIssue(data);
        setPriority(data.priority || '');
        generateSummaryAndReply(data.description);
      }

      setLoading(false);
    };

    const generateSummaryAndReply = async (description) => {
      try {
        const sumRes = await axios.post(
          'https://api.cohere.ai/v1/summarize',
          {
            text: description,
            length: 'medium',
            format: 'paragraph',
            model: 'summarize-xlarge',
          },
          {
            headers: {
              Authorization: `Bearer xyV9r163fmM8ieMhIFAUbmymr6DakgKJ8wj520lv`,
              'Content-Type': 'application/json',
            },
          }
        );

        const summaryText = sumRes.data.summary || '';
        setSummary(summaryText);

        const replyPrompt = `You are a municipal officer. Write a polite and informative response to the citizen about the following issue:\n\n"${summaryText}"\n\nReply:`;
        const replyRes = await axios.post(
          'https://api.cohere.ai/v1/generate',
          {
            model: 'command',
            prompt: replyPrompt,
            max_tokens: 100,
            temperature: 0.5,
          },
          {
            headers: {
              Authorization: `Bearer xyV9r163fmM8ieMhIFAUbmymr6DakgKJ8wj520lv`,
              'Content-Type': 'application/json',
            },
          }
        );

        setReply(replyRes.data.generations[0].text.trim());
      } catch (err) {
        console.error('AI error:', err.message);
      }
    };

    fetchIssue();
  }, [id]);

  const handlePriorityChange = async (e) => {
    const newPriority = e.target.value;
    setPriority(newPriority);

    const { error } = await supabase
      .from('issues')
      .update({ priority: newPriority })
      .eq('id', id);

    if (error) {
      console.error('Priority update error:', error.message);
    }
  };

  // PUBLIC_INTERFACE
  /** Delete this issue, show confirmation, feedback, and redirect. */
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this issue? This action cannot be undone.")) return;
    setDeleting(true);
    setError('');
    setSuccess('');

    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', id);

    if (error) {
      setError("Failed to delete issue.");
      setDeleting(false);
    } else {
      setSuccess("Issue deleted successfully.");
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200); // delay for user to read message
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!issue) return <p>Issue not found.</p>;

  return (
    <div className="container" style={{ maxWidth: "800px", margin: "40px auto", paddingTop: "24px" }}>
      <div className="card-bg" style={{ background: "#f8f5fc" }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--primary)", marginBottom: "18px" }}>{issue.title}</h2>

        {error && (
          <p className="text-red-600 error-message" style={{ marginBottom: 10 }}>{error}</p>
        )}
        {success && (
          <p className="text-green-600 success-message" style={{ marginBottom: 10 }}>{success}</p>
        )}

        <div className="mb-2"><strong style={{ color: "var(--primary-dark)" }}>Name:</strong> {issue.name}</div>
        <div className="mb-2"><strong style={{ color: "var(--primary-dark)" }}>Address:</strong> {issue.address}</div>
        <div className="mb-2"><strong style={{ color: "var(--primary-dark)" }}>Phone:</strong> {issue.phone}</div>
        <div className="mb-2"><strong style={{ color: "var(--primary-dark)" }}>Category:</strong> {issue.category}</div>
        <div className="mb-4"><strong style={{ color: "var(--primary-dark)" }}>Description:</strong> {issue.description}</div>

        <div className="mb-2">
          <strong style={{ color: "var(--accent)" }}>Summary (AI):</strong>
          <p style={{
            background: "var(--primary-light)",
            color: "#341132",
            padding: "11px",
            borderRadius: "12px",
            boxShadow: "0 0 4px 0 #b69ddb6b",
            marginTop: "4px"
          }}>{summary}</p>
        </div>

        <div className="mb-2">
          <strong style={{ color: "var(--accent)" }}>Suggested Reply (AI):</strong>
          <p style={{
            background: "#f3e6fa",
            color: "#492a68",
            padding: "12px",
            borderRadius: "12px",
            fontStyle: "italic",
            marginTop: "4px"
          }}>{reply}</p>
        </div>

        <div className="mb-2" style={{ marginTop: "18px" }}>
          <strong style={{ color: "var(--primary-dark)" }}>Assign Priority:</strong>
          <select
            value={priority}
            onChange={handlePriorityChange}
            style={{ marginLeft: "10px", padding: "8px 13px", borderRadius: "9px" }}
            disabled={deleting}
          >
            <option value="">Select</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        {issue.images && issue.images.length > 0 && (
          <div style={{ marginTop: "22px" }}>
            <strong style={{ color: "var(--primary)" }}>Images:</strong>
            <div style={{ display: "flex", gap: "13px", flexWrap: "wrap", marginTop: "8px" }}>
              {issue.images.map((url, i) => (
                <img key={i} src={url} alt={`Issue ${i}`} style={{
                  width: "120px",
                  borderRadius: "12px",
                  boxShadow: "0 2px 12px #a7a2b280"
                }} />
              ))}
            </div>
          </div>
        )}

        {issue.location_url && (
          <div style={{ marginTop: "22px" }}>
            <a
              href={issue.location_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "var(--accent)",
                fontWeight: 700,
                fontSize: "1rem",
                textDecoration: "underline"
              }}
            >
              📍 View Location on Google Maps
            </a>
          </div>
        )}

        <div style={{ marginTop: "32px" }}>
          <button
            className="btn"
            type="button"
            style={{
              background: "var(--error)",
              color: "var(--background)",
              fontWeight: 700,
              fontSize: "1.07rem",
              padding: "13px 36px",
              borderRadius: "13px",
              outline: "2px solid transparent",
              outlineOffset: "2px",
              border: "2px solid var(--border-color)",
              opacity: deleting ? 0.6 : 1,
              cursor: deleting ? "not-allowed" : "pointer",
              marginTop: "0.8rem"
            }}
            disabled={deleting}
            aria-label="Delete issue"
            onClick={handleDelete}
            onFocus={e => (e.target.style.outline = "2.5px solid var(--error)")}
            onBlur={e => (e.target.style.outline = "2px solid transparent")}
          >
            {deleting ? "Deleting..." : "Delete Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}
