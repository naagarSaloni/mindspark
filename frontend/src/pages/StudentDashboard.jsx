 import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function StudentDashboard() {
  const { user } = useAuth()

  return (
    <main className="page container dashboard-page">
      <section className="panel hero-panel-card">
        <p className="eyebrow">Student portal</p>

        <h2>Hello, {user?.full_name}</h2>

        <p className="muted">
          Join a test using token, submit answers, and check your progress history.
        </p>

        <div className="action-row">
          <Link className="button" to="/student/join-test">
            Join Test
          </Link>

          {/* ✅ FIXED HERE */}
          <Link className="button button-soft" to="/student/history">
            My History
          </Link>
        </div>
      </section>

      <section className="simple-grid two-col">
        <div className="info-card large-card">
          <h3>How it works</h3>
          <p>
            Enter the token shared by your teacher. Attempt the generated questions and submit your responses.
          </p>
        </div>

        <div className="info-card large-card">
          <h3>After submission</h3>
          <p>
            See scores, correct answers, and AI-generated feedback for improvement.
          </p>
        </div>
      </section>
    </main>
  )
}

export default StudentDashboard