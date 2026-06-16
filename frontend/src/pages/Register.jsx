import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://mindspark-backend-264v.onrender.com/api'

function Register() {
  const [role, setRole] = useState('teacher')
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    unique_id: '',
  })
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')

    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, role }),
    })
    const data = await res.json()
    if (!res.ok) {
      setMessage(data.detail || 'Registration failed')
      return
    }
    setMessage('Registration successful. Please login.')
    setTimeout(() => navigate('/login'), 900)
  }

  return (
    <main className="page container auth-page">
      <section className="auth-card narrow-card">
        <div className="role-switch">
          <button className={role === 'teacher' ? 'role-btn active' : 'role-btn'} onClick={() => setRole('teacher')}>Teacher</button>
          <button className={role === 'student' ? 'role-btn active' : 'role-btn'} onClick={() => setRole('student')}>Student</button>
        </div>
        <h2>Create your account</h2>
        <p className="muted">Register with your {role === 'teacher' ? 'teacher ID' : 'admission number'}.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <input name="full_name" placeholder="Full name" onChange={handleChange} required />
          <input name="username" placeholder="Username" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <input
            name="unique_id"
            placeholder={role === 'teacher' ? 'Teacher ID' : 'Admission Number'}
            onChange={handleChange}
            required
          />
          <button className="button" type="submit">Register as {role}</button>
        </form>
        {message && <p className="status-text">{message}</p>}
      </section>
    </main>
  )
}

export default Register
