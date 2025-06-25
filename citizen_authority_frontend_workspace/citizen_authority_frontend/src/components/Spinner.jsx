import React from "react";

// PUBLIC_INTERFACE
/**
 * A minimal, accessible loading spinner for use in buttons or inline UI.
 * Usage: <Spinner size={22} /> or <Spinner inline />
 */
export default function Spinner({ size = 22, inline = false, color }) {
  // Prefer CSS variable matching palette if available.
  const spinnerColor = color || "var(--primary)";
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: inline ? "inline-block" : "block",
        verticalAlign: "middle",
        margin: inline ? "0 2px" : "auto"
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        style={{
          display: "inline-block",
          verticalAlign: "middle",
        }}
        aria-hidden="true"
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={spinnerColor}
          strokeWidth="5"
          strokeDasharray="100"
          strokeDashoffset="60"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            dur="1.04s"
            from="0 25 25"
            to="360 25 25"
            repeatCount="indefinite"
          />
        </circle>
      </svg>
    </span>
  );
}
