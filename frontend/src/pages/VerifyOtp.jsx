import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "http://127.0.0.1:8000/api";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const email = localStorage.getItem("reset_email");

  const handleVerify = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/auth/verify-otp`, {
        email,
        otp,
      });

      alert("OTP Verified");
      navigate("/reset-password");

    } catch (err) {
      alert(err.response?.data?.detail || "Invalid OTP");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Verify OTP</h2>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={styles.input}
            required
          />

          <button style={styles.button}>
            Verify OTP
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f4f6f8",
  },
  card: {
    padding: "30px",
    background: "white",
    borderRadius: "10px",
    width: "320px",
    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "10px 0",
  },
  button: {
    width: "100%",
    padding: "10px",
    background: "green",
    color: "white",
    border: "none",
  },
};