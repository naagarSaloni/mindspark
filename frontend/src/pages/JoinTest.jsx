import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = 'https://mindspark-backend-264v.onrender.com/api'

function JoinTest() {
  const { token } = useAuth()
  const navigate = useNavigate()

  const [joinToken, setJoinToken] = useState('')
  const startTimeRef = useRef(null)

  const [exam, setExam] = useState(null)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false)
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const [warning, setWarning] = useState('')

  const parseError = (err) => {
    if (!err) return 'Error'
    if (typeof err === 'string') return err
    if (Array.isArray(err)) return err.map((e) => e?.msg).join(', ')
    if (typeof err === 'object') {
      return err?.detail?.[0]?.msg || err?.msg || 'Validation error'
    }
    return 'Error'
  }

  const normalizedQuestions = useMemo(() => {
    if (!exam) return []

    let raw = exam.questions

    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw)
      } catch {
        raw = []
      }
    }

    if (raw && !Array.isArray(raw) && Array.isArray(raw.questions)) {
      raw = raw.questions
    }

    if (!Array.isArray(raw)) return []

    return raw.map((q, idx) => ({
      id: q.id ?? idx,
      question: q.question || `Question ${idx + 1}`,
      options: Array.isArray(q.options) ? q.options : [],
      type: Array.isArray(q.options) ? 'mcq' : 'subjective'
    }))
  }, [exam])

  const enterFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen failed:', err)
    }
  }

  const handleSubmit = async () => {
    if (!exam || submitting) return

    setSubmitting(true)
    setHasAutoSubmitted(true)
    setError('')

    try {
      const payload = {
        exam_id: Number(exam.exam_id),
        answers: normalizedQuestions.map((q, idx) => ({
          question: q.question,
          answer: answers[idx] || ''
        }))
      }

      const res = await fetch(`${API}/attempts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(
          typeof data.detail === 'string'
            ? data.detail
            : JSON.stringify(data.detail)
        )
        return
      }

      localStorage.setItem('lastResult', JSON.stringify(data))
      navigate('/result')
    } catch (err) {
      console.error(err)
      setError('Server error while submitting test.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleJoin = async () => {
    setLoading(true)
    setError('')

    try {
      await enterFullScreen()

      const res = await fetch(`${API}/exams/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          token: joinToken.trim().toUpperCase()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(parseError(data.detail))
        setExam(null)
        return
      }

      setExam(data)
      setAnswers({})
      setTabSwitchCount(0)
      setWarning('')
      setHasAutoSubmitted(false)
      setTimeLeft(data.timer_minutes * 60)
      startTimeRef.current = Date.now()
    } catch (err) {
      console.error(err)
      setError('Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (idx, value) => {
    setAnswers((prev) => ({
      ...prev,
      [idx]: value
    }))
  }

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60)
    const seconds = sec % 60

    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }

  useEffect(() => {
    if (!exam?.timer_minutes) return

    const total = exam.timer_minutes * 60

    setTimeLeft(total)
    startTimeRef.current = Date.now()

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - startTimeRef.current) / 1000
      )

      const remaining = Math.max(0, total - elapsed)

      setTimeLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)

        if (!hasAutoSubmitted) {
          handleSubmit()
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [exam])

  useEffect(() => {
    if (!exam) return

    const handleVisibilityChange = () => {
      if (!document.hidden) return

      setTabSwitchCount((prev) => {
        const count = prev + 1

        if (count === 1) {
          setWarning('⚠️ Warning: Do not switch tabs!')
          alert('⚠️ Warning: Do not switch tabs!')
        } else if (count === 2) {
          setWarning('⚠️ Final Warning! Next switch will submit test.')
          alert('⚠️ Final Warning! Next switch will submit test.')
        } else if (count >= 3) {
          handleSubmit()
        }

        return count
      })
    }

    document.addEventListener(
      'visibilitychange',
      handleVisibilityChange
    )

    return () => {
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityChange
      )
    }
  }, [exam])

  return (
    <main className="page container dashboard-page">
      {!exam ? (
        <section className="panel form-panel narrow-card">
          <p className="eyebrow">Join test</p>
          <h2>Enter token</h2>

          <input
            value={joinToken}
            onChange={(e) =>
              setJoinToken(e.target.value.toUpperCase())
            }
            placeholder="Enter teacher token"
          />

          {error && <p className="error-text">{error}</p>}

          <div className="btn-space">
            <button
              type="button"
              className="button"
              disabled={loading}
              onClick={handleJoin}
            >
              {loading ? 'Opening...' : 'Open Test'}
            </button>
          </div>
        </section>
      ) : (
        <section className="panel result-panel">
          <h2>{exam.title}</h2>

          <div className="timer">
            Time Left: <b>{formatTime(timeLeft)}</b>
          </div>

          {warning && (
            <div className="warning-box">
              {warning}
            </div>
          )}

          <p className="muted">
            {exam.subject} · {exam.timer_minutes} minutes
          </p>

          {error && <p className="error-text">{error}</p>}

          <div className="question-list">
            {normalizedQuestions.map((q, idx) => (
              <div key={q.id} className="question-card">
                <span className="question-tag">
                  {q.type === 'mcq' ? 'MCQ' : 'Subjective'}
                </span>

                <h3 className="question-title">
                  Q{idx + 1}. {q.question}
                </h3>

                {q.type === 'mcq' ? (
                  <div className="option-list">
                    {q.options.map((opt, i) => (
                      <label
                        key={i}
                        className="option-item"
                      >
                        <input
                          type="radio"
                          name={`q-${idx}`}
                          value={opt}
                          checked={answers[idx] === opt}
                          onChange={() =>
                            handleAnswerChange(idx, opt)
                          }
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows="4"
                    value={answers[idx] || ''}
                    onChange={(e) =>
                      handleAnswerChange(
                        idx,
                        e.target.value
                      )
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <div className="btn-space">
            <button
              type="button"
              className="button"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Test'}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}

export default JoinTest