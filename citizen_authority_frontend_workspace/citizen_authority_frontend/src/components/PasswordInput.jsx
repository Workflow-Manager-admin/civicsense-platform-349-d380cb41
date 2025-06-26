import { useState } from "react";

// PUBLIC_INTERFACE
/**
 * PasswordInput is a controlled-input that toggles between masked and plain text,
 * with a modern minimal eye icon. Drop-in replacement for <input type="password" />.
 * Props: { value, onChange, placeholder, name, ...inputProps }
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  name = "password",
  inputProps = {},
  id,
  minLength,
  required = true,
  autoComplete = "current-password"
}) {
  const [show, setShow] = useState(false);

  // Accessible eye/eye-off SVG, no external icon dep
  const EyeIcon = ({ open, ...rest }) =>
    open ? (
      // Eye Open (show)
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--primary-hover)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
        aria-label="Hide password"
        focusable="false"
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M2 12C4.5 7 9 4 12 4s7.5 3 10 8c-2.5 5-7 8-10 8s-7.5-3-10-8z" />
      </svg>
    ) : (
      // Eye Off (hide)
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--text-secondary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
        aria-label="Show password"
        focusable="false"
      >
        <path d="M17.94 17.94A10.05 10.05 0 0 1 12 20c-3 0-7.5-3-10-8a17.77 17.77 0 0 1 3.2-4.76M9.53 9.53A2.996 2.996 0 0 1 12 9c1.66 0 3 1.34 3 3 0 .47-.12.91-.32 1.29"/>
        <path d="M22 5.5l-10 13m0 0L2 5.5M15 12a3 3 0 0 1-6 0" />
      </svg>
    );

  return (
    <div style={{
        position: "relative",
        width: "100%",
        margin: "8px 0"
      }}
    >
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        {...inputProps}
        style={{
          width: "100%",
          padding: "12px 44px 12px 10px",
          border: "1px solid var(--border-color)",
          borderRadius: 8,
          background: "var(--neutral-bg)",
          color: "var(--text-primary)",
          fontSize: "1rem",
          fontWeight: 500,
          outline: "none"
        }}
        aria-label={placeholder}
      />
      <button
        type="button"
        tabIndex={0}
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((v) => !v)}
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          padding: 0,
          margin: 0,
          cursor: "pointer",
          outline: "none",
          display: "flex",
          alignItems: "center",
          height: 28,
          width: 30,
        }}
        onFocus={e => (e.target.style.outline = "2.5px solid var(--primary-hover)")}
        onBlur={e => (e.target.style.outline = "none")}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}
