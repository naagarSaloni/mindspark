import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function TeacherDashboard() {
  const { user } = useAuth()

  return (
    <main className="page container dashboard-page">
      <section className="panel hero-panel-card">
        <p className="eyebrow">Teacher portal</p>
        <h2>Hello, {user?.full_name}</h2>
        <p className="muted">Create tests from PDF content, generate tokens, and review class performance.</p>
        <div className="action-row">
          <Link className="button" to="/teacher/create-test">Create New Test</Link>
          <Link className="button button-soft" to="/teacher/history">View History</Link>
        </div>
      </section>

      <section className="simple-grid two-col">
        <div className="info-card large-card">
          <h3>Teacher workflow</h3>
          <p>Upload a PDF, choose number of questions, select MCQ or subjective mode, set difficulty and timer, then generate a student token.</p>
        </div>
        <div className="info-card large-card">
          <h3>Reports</h3>
          <p>See marks, performance trends, and plagiarism flags for every submitted attempt.</p>
        </div>
      </section>
    </main>
  )
}

export default TeacherDashboard
