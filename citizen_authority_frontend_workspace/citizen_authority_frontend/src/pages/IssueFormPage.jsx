import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import axios from 'axios';
import emailjs from 'emailjs-com';
import Spinner from '../components/Spinner';

// ... [AI functions: summarizeIssue, embedText, cosineSimilarity, generateTags] ...

// 🔹 Cohere: Summarize the issue
async function summarizeIssue(description) {
  if (!description || !description.trim()) {
    throw new Error("Description is empty");
  }

  const res = await axios.post(
    'https://api.cohere.ai/v1/summarize',
    {
      text: description,
      length: 'medium',
      format: 'paragraph',
      model: 'summarize-xlarge'
    },
    {
      headers: {
        Authorization: `Bearer xyV9r163fmM8ieMhIFAUbmymr6DakgKJ8wj520lv`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.data.summary) {
    throw new Error("No summary returned from Cohere");
  }

  return res.data.summary;
}

// 🔹 Cohere: Generate embedding
async function embedText(text) {
  const res = await axios.post(
    'https://api.cohere.ai/v1/embed',
    {
      texts: [text],
      model: 'embed-english-v3.0',
      input_type: 'search_document'
    },
    {
      headers: {
        Authorization: `Bearer xyV9r163fmM8ieMhIFAUbmymr6DakgKJ8wj520lv`,
        'Content-Type': 'application/json'
      }
    }
  );

  if (!res.data.embeddings || !Array.isArray(res.data.embeddings) || res.data.embeddings.length === 0) {
    throw new Error("Cohere embedding failed: empty or invalid response.");
  }

  return res.data.embeddings[0];
}

// 🔹 Local cosine similarity
function cosineSimilarity(vecA, vecB) {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
}

// 🔹 Cohere: Generate tags
async function generateTags(text) {
  const prompt = `Extract relevant hashtags from this civic issue report:\n"${text}"\nHashtags:`;
  const res = await axios.post('https://api.cohere.ai/v1/generate', {
    model: 'command',
    prompt,
    max_tokens: 30,
    temperature: 0.5
  }, {
    headers: {
      Authorization: `Bearer xyV9r163fmM8ieMhIFAUbmymr6DakgKJ8wj520lv`,
      'Content-Type': 'application/json'
    }
  });

  const tagsRaw = res.data.generations[0].text.trim();
  return tagsRaw.match(/#[\w-]+/g) || [];
}

export default function IssueFormPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    title: '',
    description: '',
    location_url: '',
    category: '',
    priority: ''
  });

  const [customCategory, setCustomCategory] = useState('');
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Spacing sizes
  const FIELD_SPACING = 18; // px

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user || userError) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    if (formData.location_url) {
      const regex = /^https:\/\/www\.google\.com\/maps\?q=(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/;
      if (!regex.test(formData.location_url.trim())) {
        setError('Invalid Google Maps link.');
        setLoading(false);
        return;
      }
    }

    if (formData.category === 'other' && !customCategory.trim()) {
      setError('Please specify the issue category.');
      setLoading(false);
      return;
    }

    const finalCategory = formData.category === 'other' ? customCategory.trim() : formData.category;

    let imageUrls = [];
    if (images.length > 0) {
      try {
        const uploads = await Promise.all(
          images.map(async (file, index) => {
            const filePath = `${user.id}/${Date.now()}_${index}_${file.name}`;
            const { error: uploadError } = await supabase.storage
              .from('issue-images')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicData } = supabase.storage
              .from('issue-images')
              .getPublicUrl(filePath);

            return publicData.publicUrl;
          })
        );
        imageUrls = uploads;
      } catch (uploadError) {
        console.error('Upload Failed:', uploadError.message);
        setError(`Failed to upload images: ${uploadError.message}`);
        setLoading(false);
        return;
      }
    }

    if (formData.description.length < 250) {
      setError('Description must be at least 250 characters for AI summarization.');
      setLoading(false);
      return;
    }

    let summary = '', embedding = [], sentiment = '', tags = [];
    try {
      summary = await summarizeIssue(formData.description);
      embedding = await embedText(formData.description);
      sentiment = "unclassified";
      tags = await generateTags(formData.description);
    } catch (err) {
      console.error('AI error:', err.response?.data || err.message);
      setError('AI services failed. Please try again later.');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('issues')
        .select('embedding');

      if (error) throw error;

      const existingEmbeddings = data.filter(row => row.embedding);
      const isDuplicate = existingEmbeddings.some(existing =>
        cosineSimilarity(embedding, existing.embedding) > 0.9
      );

      if (isDuplicate) {
        setError('This issue may already be reported.');
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error('Duplicate check failed:', err.message);
    }

    const { error: insertError } = await supabase.from('issues').insert({
      ...formData,
      category: finalCategory,
      citizen_id: user.id,
      images: imageUrls,
      summary,
      embedding,
      sentiment,
      tags
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      setSuccess('Issue submitted successfully.');
      setFormData({
        name: '',
        phone: '',
        address: '',
        title: '',
        description: '',
        location_url: '',
        category: '',
        priority: ''
      });
      setCustomCategory('');
      setImages([]);
      setLoading(false);

      // ✅ Send confirmation email
      const userEmail = user?.email;
      if (userEmail) {
        try {
          await emailjs.send(
            'service_0lso4od',
            'template_rpsj2zc',
            {
              name: formData.name,
              title: formData.title,
              description: formData.description,
              to_email: userEmail
            },
            'hRaD4qFMR-kuDWqtN'
          );
          console.log("Confirmation email sent.");
        } catch (emailErr) {
          console.error("Email failed:", emailErr.message);
        }
      }
    }
  };

  // --- Modern, strict vertical stacked IssueForm with card layout and green/white palette ---
  return (
    <div
      style={{
        background: "#E6F4EA",
        minHeight: "100vh",
        width: "100vw",
        padding: 0,
        margin: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "48px auto 0 auto",
          padding: 30,
          background: "#fff",
          borderRadius: 12,
          border: "1px solid #CDE6D3",
          boxShadow: "var(--shadow)",
          fontFamily: "Inter, Segoe UI, Arial, sans-serif",
        }}
        role="form"
        aria-label="Issue Report Form"
        tabIndex={0}
      >
        <h2
          style={{
            color: "#000",
            fontWeight: 900,
            fontSize: "2rem",
            marginBottom: "1.2rem",
            letterSpacing: "0.01em",
            textAlign: "center",
          }}
        >
          Submit an Issue
        </h2>
        {error && (
          <p
            style={{
              marginBottom: FIELD_SPACING,
              fontWeight: 600,
              background: "#E57373",
              color: "#fff",
              borderRadius: 8,
              padding: "11px 13px",
              border: "1.2px solid #E57373",
              fontSize: "1.07rem",
              textAlign: "center",
            }}
            role="alert"
          >
            {error}
          </p>
        )}
        {success && (
          <p
            style={{
              marginBottom: FIELD_SPACING,
              fontWeight: 600,
              background: "#D6F5E3",
              color: "#000",
              borderRadius: 8,
              padding: "11px 13px",
              border: "1.2px solid #D6F5E3",
              fontSize: "1.07rem",
              textAlign: "center",
            }}
          >
            {success}
          </p>
        )}
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: `${FIELD_SPACING}px`,
            width: "100%",
          }}
        >
          {/* Name */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="name" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={formData.name}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>
          {/* Phone */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="phone" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="text"
              autoComplete="tel"
              required
              value={formData.phone}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>
          {/* Address */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="address" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              required
              value={formData.address}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>
          {/* Title */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="title" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              value={formData.title}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>
          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="category" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Category
            </label>
            <select
              id="category"
              name="category"
              required
              value={formData.category}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            >
              <option value="">Select Category</option>
              <option value="pothole">Pothole</option>
              <option value="water">Water Issue</option>
              <option value="garbage">Garbage</option>
              <option value="light">Light Outage</option>
              <option value="other">Other</option>
            </select>
          </div>
          {/* Custom category (if "other") */}
          {formData.category === "other" && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label htmlFor="customCategory" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
                Specify Category
              </label>
              <input
                id="customCategory"
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                style={{
                  border: "1px solid #CDE6D3",
                  borderRadius: 8,
                  padding: "12px 10px",
                  background: "#F9FCFA",
                  color: "#000",
                  fontSize: "1rem",
                  fontWeight: 500,
                  outline: "none",
                }}
              />
            </div>
          )}
          {/* Description */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="description" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Description
              <span style={{ fontWeight: 400, fontSize: "0.97rem", marginLeft: 8, color: "#A8D5BA" }}>
                (min 250 chars for best AI summary)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              required
              value={formData.description}
              onChange={handleChange}
              style={{
                minHeight: 88,
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>
          {/* Priority */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="priority" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              required
              value={formData.priority}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            >
              <option value="">Select Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          {/* Maps Link */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="location_url" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Maps Link{" "}
              <span style={{ fontWeight: 400, color: "#A8D5BA", marginLeft: 6, fontSize: "0.97rem" }}>
                (optional)
              </span>
            </label>
            <input
              id="location_url"
              name="location_url"
              type="url"
              placeholder="https://www.google.com/maps?q=12.9716,77.5946"
              value={formData.location_url}
              onChange={handleChange}
              style={{
                border: "1px solid #CDE6D3",
                borderRadius: 8,
                padding: "12px 10px",
                background: "#F9FCFA",
                color: "#000",
                fontSize: "1rem",
                fontWeight: 500,
                outline: "none",
              }}
            />
          </div>
          {/* Images */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="images" style={{ color: "#000", fontWeight: 600, marginBottom: 6 }}>
              Upload Images
              <span style={{ color: "#A8D5BA", fontWeight: 400, fontSize: "0.97rem", marginLeft: 7 }}>
                (up to 3)
              </span>
            </label>
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImages(Array.from(e.target.files).slice(0, 3))}
              style={{
                minHeight: "unset",
                padding: "0",
                border: "none",
                background: "transparent",
                color: "#000",
                fontSize: "1rem",
                margin: 0,
                fontFamily: "inherit",
              }}
            />
          </div>
          {/* Submit Button */}
          <button
            type="submit"
            className={loading ? "btn btn-loading" : ""}
            style={{
              width: "100%",
              background: "#A8D5BA",
              color: "#000",
              fontWeight: 700,
              fontSize: "1.16rem",
              marginTop: 2,
              border: "none",
              borderRadius: 10,
              padding: "14px 0",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
              boxShadow: "0 2px 12px #A8D5BA17",
              position: "relative"
            }}
            onMouseOver={e => { if (!loading) e.target.style.background = "#93C6A0"; }}
            onMouseOut={e => { if (!loading) e.target.style.background = "#A8D5BA"; }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? (
              <span className="btn-spinner" style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Spinner size={24} inline color="#93C6A0" />
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </form>
        <style>{`
          @media (max-width: 900px) {
            div[role="form"] {
              max-width: 98vw;
              padding: 22px 2vw !important;
            }
          }
          @media (max-width: 600px) {
            div[role="form"] {
              padding: 11vw 3vw !important;
              min-width: 0 !important;
            }
            form > div {
              margin-bottom: 13px !important;
            }
            button[type="submit"] {
              font-size: 1.04rem;
              padding: 13px 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
