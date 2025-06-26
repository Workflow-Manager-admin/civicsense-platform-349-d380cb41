import React, { useState } from "react";

// PUBLIC_INTERFACE
/**
 * Accessible password field with show/hide toggle.
 * Usage: <PasswordInput value={pw} onChange={setPw} [placeholder] [id] [required] [minLength] />
 */
export default function PasswordInput({
  value,
  onChange,
  placeholder = "Password",
  id = undefined,
  required = false,
  minLength = undefined,
  autoComplete = "current-password",
  disabled = false,
  style = {},
  inputStyle = {},
  testId = undefined,
}) {
  const [visible, setVisible] = useState(false);
  /** Toggle password field visibility */
  // PUBLIC_INTERFACE
  const toggleVisibility = () => setVisible(v => !v);

  return (
    <div style={{ position: "relative", ...style }}>
      <input
        id={id}
        data-testid={testId}
        type={visible ? "text" : "password"}
        value={value}
        onChange={e => typeof onChange === "function" ? onChange(e.target.value) : null}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{
          paddingRight: 48,
          width: "100%",
          ...inputStyle,
        }}
      />
      <button
        type="button"
        tabIndex={0}
        onClick={toggleVisibility}
        aria-label={visible ? "Hide Password" : "Show Password"}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          height: "100%",
          width: 44,
          border: "none",
          background: "none",
          color: "var(--primary-hover)",
          cursor: "pointer",
          fontSize: "1.1rem",
          fontWeight: 700,
          outline: "none",
        }}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            toggleVisibility();
          }
        }}
      >
        {visible
          ? <span title="Hide Password" aria-hidden="true">🙈</span>
          : <span title="Show Password" aria-hidden="true">👁️</span>
        }
      </button>
    </div>
  );
}
