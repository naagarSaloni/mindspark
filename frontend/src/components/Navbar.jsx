 import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="navbar-wrap">
      <nav className="navbar container">

        <Link to="/" className="brand">
          Mind<span>Spark</span>
        </Link>

        <div className="nav-actions">

          {/* NOT LOGGED IN */}
          {!user && (
            <>
              <Link to="/" className="button button-soft">Home</Link>
              <Link to="/register" className="nav-link">Register</Link>
              <Link to="/login" className="nav-link">Login</Link>
            </>
          )}

          {/* LOGGED IN */}
          {user && (
            <>
              <span className="user-pill">
                {user.full_name} · {user.role}
              </span>

              {/* DASHBOARD ROUTE FIX */}
              <Link
                to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'}
                className="nav-link"
              >
                Dashboard
              </Link>

              {/* HISTORY ROUTE FIX (IMPORTANT) */}
              <Link
                to={user.role === 'teacher' ? '/teacher/history' : '/student/history'}
                className="nav-link"
              >
                History
              </Link>

              <button
                className="button button-soft"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          )}

        </div>
      </nav>
    </header>
  )
}

export default Navbar