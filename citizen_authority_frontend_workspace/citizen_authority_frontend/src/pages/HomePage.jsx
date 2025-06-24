import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="container" style={{ paddingTop: "90px", paddingBottom: "44px" }}>
      <section className="hero">
        <div className="subtitle">A Modern Civic Issue Platform</div>
        <h1 className="title">Welcome to CivicFlow</h1>
        <p className="description mb-2">
          CivicFlow helps citizens report civic issues and enables authorities to track and resolve them efficiently.
        </p>
      </section>

      <div
        className="row"
        style={{
          display: "flex",
          gap: "32px",
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        {/* Citizens Section */}
        <div className="card" style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 500 }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--primary)" }}>Citizens</h2>
          <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
            Report potholes, garbage, broken streetlights, and other local issues in your area.
          </p>
          <div style={{ marginTop: "14px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn" to="/signup/citizen">Sign Up as Citizen</Link>
            <Link className="btn" to="/login/citizen" style={{ background: "var(--accent)", color: "#fff" }}>
              Login as Citizen
            </Link>
          </div>
        </div>
        {/* Authorities Section */}
        <div className="card" style={{ flex: "1 1 280px", minWidth: 260, maxWidth: 500 }}>
          <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--accent)" }}>Authorities</h2>
          <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
            Track reports, verify citizen-submitted issues, and resolve them systematically.
          </p>
          <div style={{ marginTop: "14px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link className="btn" to="/signup/authority">Sign Up as Authority</Link>
            <Link className="btn" to="/login/authority" style={{ background: "var(--accent)", color: "#fff" }}>
              Login as Authority
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
