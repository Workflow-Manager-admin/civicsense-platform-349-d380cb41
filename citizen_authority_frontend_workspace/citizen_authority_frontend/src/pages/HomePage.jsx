import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div
      className="container"
      style={{ paddingTop: "90px", paddingBottom: "44px", minHeight: "90vh" }}
      aria-label="Welcome Civic Platform"
    >
      <section
        className="hero"
        role="banner"
        tabIndex={0}
        style={{
          outline: "none",
          background: "linear-gradient(110deg, var(--primary-light), var(--card-bg))",
          borderRadius: "var(--radius)"
        }}
        aria-labelledby="main-hero-heading"
      >
        <div className="subtitle"
          style={{ fontSize: "1.18rem", color: "var(--primary-hover)", letterSpacing: "0.03em", textTransform: "uppercase" }}>
          A Modern Civic Issue Platform
        </div>
        <h1 className="title" id="main-hero-heading"
            style={{ fontFamily: "Inter, Segoe UI, Arial, sans-serif", color: "var(--text-color)" }}>
          Welcome to <span style={{ color: "var(--primary)", fontFamily: "inherit" }}>CivicFlow</span>
        </h1>
        <p
          className="description mb-2"
          style={{ fontWeight: 500, fontSize: "1.14rem", color: "var(--text-secondary)", margin: "0 auto" }}
        >
          CivicFlow helps citizens report civic issues and enables authorities to track and resolve them efficiently.
        </p>
      </section>

      <div
        className="row"
        aria-label="Entry action cards"
        style={{
          display: "flex",
          gap: "2.1rem",
          margin: "0 auto",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "stretch"
        }}
      >
        {/* Citizens Section */}
        <section className="card"
          aria-label="Citizens Card"
          tabIndex={0}
          style={{
            flex: "1 1 280px",
            minWidth: 272,
            maxWidth: 480,
            outline: "none",
            background: "var(--card-bg)",
            border: "1.5px solid var(--border-color)"
          }}
        >
          <h2
            className="text-xl font-semibold mb-2"
            style={{
              color: "var(--primary)",
              fontFamily: "inherit",
              fontSize: "1.22rem"
            }}
          >
            Citizens
          </h2>
          <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
            Report potholes, garbage, broken streetlights, and other local issues in your area.
          </p>
          <div style={{ marginTop: "14px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              className="btn btn-cta"
              to="/signup/citizen"
              aria-label="Sign Up as Citizen"
              style={{
                outline: "2px solid transparent",
                outlineOffset: "2px"
              }}
              onFocus={e => e.target.style.outline = "2.5px solid var(--accent-green)"}
              onBlur={e => e.target.style.outline = "2px solid transparent"}
            >
              Sign Up as Citizen
            </Link>
            <Link
              className="btn"
              to="/login/citizen"
              aria-label="Login as Citizen"
              style={{
                background: "var(--primary)",
                color: "var(--background)",
                fontWeight: 700,
                outline: "2px solid transparent",
                outlineOffset: "2px"
              }}
              onFocus={e => e.target.style.outline = "2.5px solid var(--primary)"}
              onBlur={e => e.target.style.outline = "2px solid transparent"}
            >
              Login as Citizen
            </Link>
          </div>
        </section>
        {/* Authorities Section */}
        <section className="card"
          aria-label="Authorities Card"
          tabIndex={0}
          style={{
            flex: "1 1 280px",
            minWidth: 272,
            maxWidth: 480,
            outline: "none",
            background: "var(--card-bg)",
            border: "1.5px solid var(--border-color)"
          }}
        >
          <h2
            className="text-xl font-semibold mb-2"
            style={{
              color: "var(--primary)",
              fontFamily: "inherit",
              fontSize: "1.22rem"
            }}
          >
            Authorities
          </h2>
          <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
            Track reports, verify citizen-submitted issues, and resolve them systematically.
          </p>
          <div style={{ marginTop: "14px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <Link
              className="btn btn-cta"
              to="/signup/authority"
              aria-label="Sign Up as Authority"
              style={{
                outline: "2px solid transparent",
                outlineOffset: "2px"
              }}
              onFocus={e => e.target.style.outline = "2.5px solid var(--accent-green)"}
              onBlur={e => e.target.style.outline = "2px solid transparent"}
            >
              Sign Up as Authority
            </Link>
            <Link
              className="btn"
              to="/login/authority"
              aria-label="Login as Authority"
              style={{
                background: "var(--primary)",
                color: "var(--background)",
                fontWeight: 700,
                outline: "2px solid transparent",
                outlineOffset: "2px"
              }}
              onFocus={e => e.target.style.outline = "2.5px solid var(--primary)"}
              onBlur={e => e.target.style.outline = "2px solid transparent"}
            >
              Login as Authority
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
