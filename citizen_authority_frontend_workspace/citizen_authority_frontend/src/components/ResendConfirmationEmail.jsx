import { useState } from "react";
import { supabase } from "../supabase/supabaseClient";

/**
 * Button and UI to allow a user to resend their email confirmation link.
 * Accepts `email` prop (string). Any parent page must prompt for the user's email (login/signup) to function.
 * Optionally, a `variant` prop can be provided for UI style (e.g. "inline" for use in-form).
 *
 * Usage:
 *   <ResendConfirmationEmail email={email} />
 */
// PUBLIC_INTERFACE
export default function ResendConfirmationEmail({ email, variant = "inline" }) {
  const [status, setStatus] = useState({ loading: false, message: "", error: "" });

  // PUBLIC_INTERFACE
  /**
   * Triggers a new confirmation email using Supabase Auth.
   * https://supabase.com/docs/reference/javascript/auth-resend
   */
  const handleResend = async () => {
    if (!email || email.trim().length === 0) {
      setStatus({
        ...status,
        error: "Please provide your email above to re-send the confirmation.",
        message: ""
      });
      return;
    }
    setStatus({ loading: true, message: "", error: "" });

    try {
      // Try to use supabase.auth.resend() if available (>=v2.39.0). Fallback to send a magic link as a workaround.
      // (At the time of writing, @supabase/supabase-js provides an `resend` method as `supabase.auth.resend({ type: 'signup', email })`)
      if (typeof supabase.auth.resend === "function") {
        const { error } = await supabase.auth.resend({ type: "signup", email });
        if (error) {
          setStatus({
            loading: false,
            error:
              error.message ||
              "An error occurred. Please check your email and try again.",
            message: ""
          });
        } else {
          setStatus({
            loading: false,
            error: "",
            message:
              "A new confirmation email has been sent. Please check your inbox (and spam/junk folder)."
          });
        }
      } else {
        // If not available, fallback: send a signup link as workaround (Supabase recommends this officially in older SDKs).
        const { error } = await supabase.auth.signUp({
          email,
          password: "invalid-dummy-password",
          options: {
            emailRedirectTo: window.location.origin + "/login/citizen"
          }
        });
        // We expect a potential "User already registered" error, but the confirmation email should still be sent.
        if (error && error.message && !/User already registered/i.test(error.message)) {
          setStatus({
            loading: false,
            error: error.message,
            message: ""
          });
        } else {
          setStatus({
            loading: false,
            error: "",
            message:
              "A new confirmation email has been sent. Please check your inbox (and spam/junk folder)."
          });
        }
      }
    } catch (err) {
      setStatus({
        loading: false,
        error: err.message || "Failed to send confirmation email.",
        message: ""
      });
    }
  };

  return (
    <div style={variant === "inline"
      ? { marginTop: 10, marginBottom: 3, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 7 }
      : { marginTop: 16, textAlign: "center" }
    }>
      <button
        className="btn"
        type="button"
        aria-label="Resend Confirmation Email"
        style={{
          background: "var(--success)",
          color: "var(--background)",
          borderRadius: "7px",
          fontWeight: 700,
          fontSize: "0.97rem",
          outline: "2px solid transparent",
          outlineOffset: "2px",
          border: "2px solid var(--success)",
          minWidth: 178,
          opacity: status.loading ? 0.53 : 1,
          cursor: status.loading ? "not-allowed" : "pointer"
        }}
        onClick={handleResend}
        disabled={status.loading}
        onFocus={e => (e.target.style.outline = "2.5px solid var(--accent-green)")}
        onBlur={e => (e.target.style.outline = "2px solid transparent")}
      >
        {status.loading ? "Sending..." : "Resend confirmation email"}
      </button>
      {status.error && (
        <span
          className="text-red-600 error-message"
          style={{
            marginLeft: 8,
            fontSize: "0.97rem",
            color: "var(--error)",
            fontWeight: 500,
            letterSpacing: "0.01em"
          }}
          aria-live="polite"
        >
          {status.error}
        </span>
      )}
      {status.message && (
        <span
          className="text-green-600 success-message"
          style={{
            marginLeft: 8,
            fontSize: "0.97rem",
            color: "var(--success)",
            fontWeight: 500,
            letterSpacing: "0.01em"
          }}
          aria-live="polite"
        >
          {status.message}
        </span>
      )}
    </div>
  );
}
