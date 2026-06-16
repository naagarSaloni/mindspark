import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://mindspark-backend-264v.onrender.com/api";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const email = localStorage.getItem("reset_email");

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API}/auth/reset-password`, {
        email,
        password,
      });

      alert("Password reset successful");

      localStorage.removeItem("reset_email");

      navigate("/login");

    } catch (err) {
      alert(err.response?.data?.detail || "Error resetting password");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Reset Password</h2>

        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />

          <button style={styles.button}>
            Reset Password
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
    background: "red",
    color: "white",
    border: "none",
  },
};