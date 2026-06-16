 import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'https://mindspark-backend-264v.onrender.com/api'

function Login() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
  e.preventDefault()
  setMessage('')

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    console.log("LOGIN RESPONSE:", data)
    console.log("ROLE:", data?.user?.role)

    if (!res.ok) {
      setMessage(data.detail || 'Login failed')
      return
    }

    if (!data?.user) {
      setMessage('Invalid server response: user missing')
      return
    }

    const role = (data.user.role || '').toLowerCase()

    console.log("FINAL ROLE:", role)

    // ✅ store ONCE
    login(data)

    // small delay ensures state update
    setTimeout(() => {
      if (role === 'admin') {
        navigate('/admin')
      } 
      else if (role === 'teacher') {
        navigate('/teacher')
      } 
      else {
        navigate('/student')
      }
    }, 50)

  } catch (err) {
    console.error(err)
    setMessage('Server error. Please try again.')
  }
}
  return (
    <main className="page container auth-page">
      <section className="auth-card narrow-card">
        <h2>Welcome back</h2>
         <p className="muted">
  Login with your username and password created during registration.
</p>

<p style={{ fontSize: "12px", color: "gray" }}>
  💡 Tip: If you forgot your username, you can use your registered email instead.
</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <input
            name="username"
            placeholder="Username or Email"
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />

          <button className="button" type="submit">
            Login
          </button>
        </form>
        <div style={{ marginTop: "10px", textAlign: "right" }}>
  <span
    onClick={() => navigate("/forgot-password")}
    style={{
      color: "#007bff",
      cursor: "pointer",
      fontSize: "14px",
    }}
  >
    Forgot Password?
  </span>
</div>

        {message && <p className="status-text">{message}</p>}
      </section>
    </main>
  )
}

export default Login