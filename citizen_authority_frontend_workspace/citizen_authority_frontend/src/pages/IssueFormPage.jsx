import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import axios from 'axios';
import emailjs from 'emailjs-com';

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user || userError) {
      setError('User not authenticated.');
      return;
    }

    if (formData.location_url) {
      const regex = /^https:\/\/www\.google\.com\/maps\?q=(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;
      if (!regex.test(formData.location_url.trim())) {
        setError('Invalid Google Maps link.');
        return;
      }
    }

    if (formData.category === 'other' && !customCategory.trim()) {
      setError('Please specify the issue category.');
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
        return;
      }
    }

    if (formData.description.length < 250) {
      setError('Description must be at least 250 characters for AI summarization.');
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

      // ✅ Send confirmation email
      const userEmail = user?.email;

      if (userEmail) {
        try {
          await emailjs.send(
            'service_0lso4od',       // 🔁 Replace with EmailJS service ID
            'template_rpsj2zc',      // 🔁 Replace with template ID
            {
              name: formData.name,
              title: formData.title,
              description: formData.description,
              to_email: userEmail     // Template variable
            },
            'hRaD4qFMR-kuDWqtN'         // 🔁 Replace with your public key
          );
          console.log("Confirmation email sent.");
        } catch (emailErr) {
          console.error("Email failed:", emailErr.message);
        }
      }
    }
  };

  /* --- Responsive, professional modern grid/card styling --- */
  return (
    <div
      className="container"
      style={{
        maxWidth: "600px",
        margin: "50px auto",
        paddingTop: "24px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
      }}
    >
      <div
        className="card"
        style={{
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow)",
          background: "var(--card-bg)",
          border: "1.5px solid var(--border-color)",
          padding: "38px 30px",
          maxWidth: 560,
          width: "100%",
          margin: "auto",
        }}
        role="form"
        aria-label="Issue Report Form"
        tabIndex={0}
      >
        <h2
          className="text-xl font-bold mb-4"
          style={{
            color: "var(--primary-hover)",
            fontWeight: 900,
            fontSize: "2rem",
            marginBottom: "1.6rem",
            letterSpacing: "0.01em",
            textAlign: "center",
          }}
        >
          Submit an Issue
        </h2>

        {error && (
          <p
            className="text-red-600 error-message"
            style={{
              marginBottom: "1rem",
              fontWeight: 600,
              background: "var(--accent-red)",
              color: "#fff",
              borderRadius: "11px",
              padding: "10px 13px",
              border: "1.2px solid var(--accent-red)",
              fontSize: "1.07rem"
            }}
          >
            {error}
          </p>
        )}
        {success && (
          <p
            className="text-green-600 success-message"
            style={{
              marginBottom: "1rem",
              fontWeight: 600,
              background: "var(--success)",
              color: "var(--text-primary)",
              borderRadius: "11px",
              padding: "10px 13px",
              border: "1.2px solid var(--accent-green)",
              fontSize: "1.07rem"
            }}
          >
            {success}
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "22px",
            width: "100%",
          }}
        >
          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="name"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem",
                }}
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  border: "1.5px solid var(--border-color)",
                  background: "var(--neutral-light)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  outline: "none",
                  boxShadow: "none",
                  fontWeight: 500
                }}
                autoComplete="name"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="phone"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem",
                }}
              >
                Phone
              </label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                style={{
                  border: "1.5px solid var(--border-color)",
                  background: "var(--neutral-light)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  outline: "none",
                  boxShadow: "none",
                  fontWeight: 500
                }}
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="address"
              style={{
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: "5px",
                letterSpacing: "0.011em",
                fontSize: "1.08rem",
              }}
            >
              Address
            </label>
            <input
              id="address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              style={{
                border: "1.5px solid var(--border-color)",
                background: "var(--neutral-light)",
                color: "var(--text-primary)",
                borderRadius: "11px",
                outline: "none",
                boxShadow: "none",
                fontWeight: 500
              }}
              autoComplete="street-address"
            />
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="title"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem",
                }}
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                style={{
                  border: "1.5px solid var(--border-color)",
                  background: "var(--neutral-light)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  outline: "none",
                  boxShadow: "none",
                  fontWeight: 500
                }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="category"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem",
                }}
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                style={{
                  background: "var(--neutral-light)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  fontWeight: 500
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
          </div>

          {formData.category === "other" && (
            <div>
              <label
                htmlFor="customCategory"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem"
                }}
              >
                Specify Category
              </label>
              <input
                id="customCategory"
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                required
                style={{
                  border: "1.5px solid var(--border-color)",
                  background: "var(--neutral-light)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  outline: "none",
                  boxShadow: "none",
                  fontWeight: 500
                }}
              />
            </div>
          )}

          <div>
            <label
              htmlFor="description"
              style={{
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: "5px",
                letterSpacing: "0.011em",
                fontSize: "1.08rem"
              }}
            >
              Description
              <span
                style={{
                  color: "var(--primary)",
                  fontWeight: 500,
                  fontSize: "0.97rem",
                  marginLeft: 6,
                }}
              >
                {" "}
                (min 250 chars for best AI summary)
              </span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              style={{
                minHeight: 84,
                resize: "vertical",
                border: "1.5px solid var(--border-color)",
                background: "var(--neutral-light)",
                color: "var(--text-primary)",
                borderRadius: "11px",
                outline: "none",
                boxShadow: "none",
                fontWeight: 500
              }}
            />
          </div>

          <div
            className="form-row"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="priority"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem"
                }}
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                style={{
                  background: "var(--neutral-light)",
                  border: "1.5px solid var(--border-color)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  fontWeight: 500
                }}
              >
                <option value="">Select Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label
                htmlFor="location_url"
                style={{
                  fontWeight: 700,
                  color: "var(--text-secondary)",
                  marginBottom: "5px",
                  letterSpacing: "0.011em",
                  fontSize: "1.08rem"
                }}
              >
                Maps Link
                <span style={{ color: "var(--primary)", fontWeight: 500, marginLeft: 6, fontSize: "0.98rem" }}>
                  (optional)
                </span>
              </label>
              <input
                id="location_url"
                type="url"
                name="location_url"
                placeholder="https://www.google.com/maps?q=12.9716,77.5946"
                value={formData.location_url}
                onChange={handleChange}
                style={{
                  border: "1.5px solid var(--border-color)",
                  background: "var(--neutral-light)",
                  color: "var(--text-primary)",
                  borderRadius: "11px",
                  outline: "none",
                  boxShadow: "none",
                  fontWeight: 500
                }}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="images"
              style={{
                fontWeight: 700,
                color: "var(--text-secondary)",
                marginBottom: "5px",
                letterSpacing: "0.011em",
                fontSize: "1.08rem",
              }}
            >
              Upload Images
              <span style={{ color: "var(--primary)", fontWeight: 500, marginLeft: 6, fontSize: "0.98rem" }}>
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
                padding: "8px 0",
                border: "none",
                background: "transparent",
                color: "var(--text-secondary)",
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-large"
            style={{
              width: "100%",
              background: "var(--primary)",
              color: "var(--text-primary)",
              fontWeight: 900,
              fontSize: "1.18rem",
              marginTop: "8px",
              boxShadow: "var(--shadow)",
              letterSpacing: "0.03em",
              border: "2px solid var(--primary-hover)",
              borderRadius: "14px",
              transition: "background 0.13s, color 0.13s, box-shadow 0.13s",
            }}
            onMouseOver={e => {
              e.target.style.background = "var(--primary-hover)";
              e.target.style.color = "var(--text-primary)";
            }}
            onMouseOut={e => {
              e.target.style.background = "var(--primary)";
              e.target.style.color = "var(--text-primary)";
            }}
          >
            Submit
          </button>
        </form>
      </div>

      <style>{`
        @media (max-width: 780px) {
          .card {
            padding: 24px 8vw !important;
          }
        }
        @media (max-width: 620px) {
          .card {
            padding: 10vw 4vw !important;
          }
          .form-row {
            grid-template-columns: 1fr !important;
            gap: 5px !important;
          }
        }
        @media (max-width: 440px) {
          .card {
            padding: 2vw !important;
          }
        }
        form input, form select, form textarea {
          font-size: 1.05rem;
        }
      `}</style>
    </div>
  );
}
