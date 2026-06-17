import { useState } from "react"
import emailjs from "@emailjs/browser";
emailjs.init("nhi7lz_zd2bJAuYpF");
const API = "https://mindspark-backend-264v.onrender.com/api"

function ForgotPassword() {
  const [step, setStep] = useState(1)

  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  // STEP 1: send OTP
  const sendOtpEmail = async (email, otp) => {
  try {
    const result = await emailjs.send(
      "service_i31xjes",
      "template_Iphoxte",
      {
        email: email,
        otp: otp,
      }
    );

    console.log("EMAIL SENT:", result.status);
  } catch (error) {
    console.error("EMAIL FAILED:", error);
    throw error;
  }
};
  const sendOtp = async (e) => {
  e.preventDefault();
  setMessage("");
  setLoading(true);

  try {
    const res = await fetch(`${API}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.detail || "Server error");
      return;
    }

    setMessage("OTP sent successfully ✔");
    setStep(2);

  } catch (err) {
    console.error(err);
    setMessage("Server error. Try again.");
  } finally {
    setLoading(false);
  }
};
  // STEP 2: reset password
  const resetPassword = async (e) => {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    if (password !== confirmPassword) {
      setMessage("Passwords do not match")
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage(data.detail || "Reset failed")
        return
      }

      setMessage("Password changed successfully ✔")
      setStep(1)
      setEmail("")
      setOtp("")
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      setMessage("Server error. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page container auth-page">
      <section
        className="auth-card narrow-card"
        style={{
          background: "var(--panel)",
          color: "var(--text)",
        }}
      >
        <h2>Forgot Password</h2>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <p className="muted">
              Enter your registered email to receive OTP
            </p>

            <form onSubmit={sendOtp} className="form-grid">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button className="button" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <p className="muted">
              Enter OTP and set new password
            </p>

            <form onSubmit={resetPassword} className="form-grid">
              <input
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <button className="button" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <button
              className="button button-soft"
              style={{ marginTop: "10px" }}
              onClick={() => setStep(1)}
            >
              Back
            </button>
          </>
        )}

        {message && (
          <p className="status-text">{message}</p>
        )}
      </section>
    </main>
  )
}

export default ForgotPassword