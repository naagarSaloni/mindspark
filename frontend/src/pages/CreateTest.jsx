 import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API = 'http://127.0.0.1:8000/api'

function CreateTest() {
  const { token } = useAuth()

  const [form, setForm] = useState({
    title: '',
    subject: '',
    question_count: 5,
    difficulty: 'medium',
    exam_type: 'mcq',
    timer_minutes: 10,
    token_valid_minutes: 10,
  })

  const [pdfFile, setPdfFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!token) {
      alert('Please login again.')
      return
    }

    if (!pdfFile) {
      alert('Please upload a PDF file.')
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('title', form.title)
      formData.append('subject', form.subject)
      formData.append('question_count', String(form.question_count))
      formData.append('difficulty', form.difficulty)
      formData.append('exam_type', form.exam_type)
      formData.append('timer_minutes', String(form.timer_minutes))
      formData.append('token_valid_minutes', String(form.token_valid_minutes))
      formData.append('pdf', pdfFile)

      const res = await fetch(`${API}/exams`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setResult(data)
        alert(data.message || 'Test created successfully')
      } else {
        alert(data.detail || data.message || 'Failed to create test')
      }
    } catch (error) {
      console.error('Create test error:', error)
      alert('Something went wrong while creating the test.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page container dashboard-page">
      <section className="panel form-panel create-test-panel">
        <div className="create-test-head">
          <p className="eyebrow">Teacher workspace</p>
          <h2>Generate an exam</h2>
          <p className="muted">
            Upload your PDF, choose settings, and create a smart test for students.
          </p>
        </div>

        <form className="form-grid create-test-grid" onSubmit={handleSubmit}>
          <div className="field full-width">
            <label>Test title</label>
            <input
              name="title"
              placeholder="Enter test title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field full-width">
            <label>Subject</label>
            <input
              name="subject"
              placeholder="Enter subject name"
              value={form.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field full-width">
            <label>Upload PDF</label>
            <input
              className="file-input"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
            />
          </div>

          <div className="field">
            <label>Question count</label>
            <input
              name="question_count"
              type="number"
              min="1"
              max="25"
              value={form.question_count}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Difficulty</label>
            <select
              name="difficulty"
              value={form.difficulty}
              onChange={handleChange}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="field">
            <label>Exam type</label>
            <select
              name="exam_type"
              value={form.exam_type}
              onChange={handleChange}
            >
              <option value="mcq">MCQ</option>
              <option value="subjective">Subjective</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

           <div className="field">
  <label>Timer (minutes)</label>
  <input
    name="timer_minutes"
    type="number"
    min="5"
    value={form.timer_minutes}
    onChange={handleChange}
  />
</div>

<div className="field">
  <label>Token Validity (minutes)</label>
  <input
    name="token_valid_minutes"
    type="number"
    min="1"
    value={form.token_valid_minutes}
    onChange={handleChange}
  />
</div>

<div className="full-width">
  <button
    className="button create-test-btn"
    type="submit"
    disabled={loading}
  >
    {loading ? 'Generating...' : 'Generate Test'}
  </button>
</div>
        </form>
      </section>

      {result && (
        <section className="panel result-panel create-result-panel">
          <div className="result-top">
            <div>
              <p className="eyebrow">Exam created</p>
              <h3>{result.title}</h3>
            </div>

            <div className="token-box">
              Student Token: <strong>{result.token}</strong>
            </div>
          </div>

          <div className="question-list">
            {result.questions?.map((q, idx) => (
              <div key={idx} className="question-card">
                <span className="question-tag">{q.type || 'question'}</span>
                <p>{q.question}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

export default CreateTest