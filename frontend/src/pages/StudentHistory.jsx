 import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

const API = 'http://127.0.0.1:8000/api'

function StudentHistory() {
  const { user, token } = useAuth()
  const [items, setItems] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/attempts/student-history`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const data = await res.json()

        if (res.ok && Array.isArray(data)) {
          setItems(data)
        } else {
          setItems([])
        }
      } catch (err) {
        console.error("History fetch error:", err)
        setItems([])
      }
    }

    if (user && token) load()
  }, [user, token])

  // -------------------------
  // SAFE SORT
  // -------------------------
  const sortedItems = useMemo(() => {
    return [...items].sort(
      (a, b) => (a.attempt_id || 0) - (b.attempt_id || 0)
    )
  }, [items])

  const scores = sortedItems
    .map(i => Number(i.score) || 0)

  // -------------------------
  // SAFE STATS
  // -------------------------
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : 0

  const maxScore =
    scores.length > 0 ? Math.max(...scores) : 0

  const knowledgeScore = Math.min(100, Number(avgScore) * 10)

  // -------------------------
  // BADGE
  // -------------------------
  let badge = 'Bronze'
  if (avgScore >= 8) badge = 'Gold'
  else if (avgScore >= 5) badge = 'Silver'

  // -------------------------
  // RECENT 10
  // -------------------------
  const recent10 = sortedItems.slice(-10)

  const chartData = recent10.map(item => ({
    attempt: String(item.attempt_id || ''),
    score: Number(item.score) || 0
  }))

  const trendData = recent10.map(item => ({
    attempt: String(item.attempt_id || ''),
    score: Number(item.score) || 0
  }))

  return (
    <main className="page container dashboard-page">

      <section className="panel result-panel">

        <p className="eyebrow">Student Dashboard</p>

        <h2>Welcome, {user?.name || 'Student'} 👋</h2>

        {/* BADGE */}
        <div className={`badge ${badge.toLowerCase()}`}>
          🏆 {badge} Performer
        </div>

        {/* STATS */}
        <div className="stats-grid">

          <div className="stat-card">
            <h3>{avgScore}</h3>
            <p>Average Score</p>
          </div>

          <div className="stat-card">
            <h3>{maxScore}</h3>
            <p>Best Score</p>
          </div>

          <div className="stat-card">
            <h3>{knowledgeScore}</h3>
            <p>Knowledge Score</p>
          </div>

        </div>

        {/* TREND */}
        {recent10.length > 0 && (
          <div className="chart-box">
            <h3>📈 Performance Trend</h3>

            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <XAxis dataKey="attempt" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* BAR */}
        {recent10.length > 0 && (
          <div className="chart-box">
            <h3>📊 Recent 10 Attempts</h3>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="attempt" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="score" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* LIST */}
        <div className="history-list">

          {items.length === 0 && (
            <p className="muted">No history yet.</p>
          )}

          {items.map((item, idx) => (
            <div className="history-item premium-card" key={item.attempt_id || idx}>

              <div className="history-left">
                <strong>{item.exam_title || 'Test'}</strong>
                <p className="muted">
                  Attempt ID: {item.attempt_id || 'N/A'}
                </p>
              </div>

              <div className="history-meta">

                <span className="score-pill">
                  Score: {item.score ?? 0}
                </span>

                <span
                  className={
                    (item.plagiarism_flag || 0) > 0.5
                      ? 'flag danger'
                      : 'flag safe'
                  }
                >
                  Plagiarism: {item.plagiarism_flag ?? 0}
                </span>

              </div>

            </div>
          ))}

        </div>

      </section>
    </main>
  )
}

export default StudentHistory