 import { useEffect, useState } from "react"
import { useAuth } from "../context/AuthContext"

const API = "http://127.0.0.1:8000/api"

/* ---------------- EXPANDABLE TEXT ---------------- */
function ExpandableText({ text, limit = 150 }) {
  const [expanded, setExpanded] = useState(false)

  if (!text) return <p className="muted">No answer available</p>

  if (text.length <= limit) return <p>{text}</p>

  return (
    <div>
      <p>{expanded ? text : text.slice(0, limit) + "..."}</p>

      <button
        className="button button-soft"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </div>
  )
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function TeacherHistory() {
  const { token } = useAuth()

  const [subjects, setSubjects] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  /* ---------------- FETCH ---------------- */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/attempts/teacher/tests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const data = await res.json()
        setSubjects(Array.isArray(data) ? data : [])
      } catch (err) {
        console.error(err)
        setSubjects([])
      }
    }

    if (token) load()
  }, [token])

  /* ---------------- SAFE STUDENTS ---------------- */
  const getStudents = (topic) => {
    if (!topic) return []
    return topic.tests || topic.students || topic.attempts || []
  }

  /* ---------------- UPDATE MARKS SAFELY ---------------- */
  const handleManualMarksChange = (value, studentIndex, qIndex) => {
    setSelectedStudent((prev) => {
      const updated = { ...prev }
      updated.answers = [...(updated.answers || [])]

      updated.answers[qIndex] = {
        ...updated.answers[qIndex],
        manual_marks: value,
      }

      return updated
    })
  }

  /* ---------------- SAVE EVALUATION ---------------- */
  const saveEvaluation = async (q, i) => {
    try {
      const res = await fetch(
        `${API}/attempts/manual-evaluation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attempt_id: selectedStudent.attempt_id,
            question_index: i,
            marks: Number(q.manual_marks || 0),
          }),
        }
      )

      const data = await res.json()

      if (res.ok) {
        alert(`Updated Score: ${data.new_score}`)

        setSelectedStudent((prev) => {
          const updated = { ...prev }
          updated.answers = [...(updated.answers || [])]

          updated.answers[i] = {
            ...updated.answers[i],
            manual_marks: q.manual_marks,
            manual_evaluation: true,
          }

          return updated
        })
      } else {
        alert(data.detail || "Failed")
      }
    } catch (err) {
      console.error(err)
      alert("Server Error")
    }
  }

  return (
    <main className="page container dashboard-page">
      <section className="panel result-panel">

      <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "12px",
    flexWrap: "wrap",
  }}
>
  <div>
    <p className="eyebrow">Teacher Console</p>
    <h2 style={{ margin: 0 }}>🧑‍🏫 Test Evaluation System</h2>
  </div>

  <button
    className="button"
    onClick={async () => {
      try {
        const response = await fetch(
          `${API}/attempts/export/excel`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!response.ok) {
          throw new Error("Failed to download")
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)

        const a = document.createElement("a")
        a.href = url
        a.download = "MindSpark_Report.xlsx"
        document.body.appendChild(a)
        a.click()
        a.remove()

        window.URL.revokeObjectURL(url)
      } catch (err) {
        console.error(err)
        alert("Failed to download report")
      }
    }}
  >
    📊 Export Excel Report
  </button>
</div> 

   

        {/* ---------------- SUBJECT LEVEL ---------------- */}
        {!selectedSubject && (
          <div className="grid">
            {subjects.map((sub, i) => (
              <div
                key={i}
                className="premium-card"
                onClick={() => setSelectedSubject(sub)}
              >
                <h3>{sub.subject}</h3>
                <p>Topics: {sub.topics?.length || 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- TOPIC LEVEL ---------------- */}
        {selectedSubject && !selectedTopic && (
          <div>
            <button
              className="button button-soft"
              onClick={() => setSelectedSubject(null)}
            >
              ← Back to Subjects
            </button>

            <h3>{selectedSubject.subject}</h3>

            <div className="grid">
              {selectedSubject.topics?.map((topic, i) => (
                <div
                  key={i}
                  className="premium-card"
                  onClick={() => setSelectedTopic(topic)}
                >
                  <h4>{topic.topic_name}</h4>
                  <p>Students: {getStudents(topic).length}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- STUDENT LEVEL ---------------- */}
        {selectedTopic && !selectedStudent && (
          <div>
            <button
              className="button button-soft"
              onClick={() => setSelectedTopic(null)}
            >
              ← Back to Topics
            </button>

            <h3>{selectedTopic.topic_name}</h3>

            <div className="grid">
              {getStudents(selectedTopic).length === 0 ? (
                <p className="muted">No students found</p>
              ) : (
                getStudents(selectedTopic).map((st, i) => (
                  <div
                    key={i}
                    className="premium-card"
                    onClick={() => setSelectedStudent(st)}
                  >
                    <h4>
                      {st.student_name || st.student?.name || "Student"}
                    </h4>
                    <p>Score: {st.score ?? st.marks ?? 0}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ---------------- QUESTION LEVEL ---------------- */}
        {selectedStudent && (
          <div>
            <button
              className="button button-soft"
              onClick={() => setSelectedStudent(null)}
            >
              ← Back to Students
            </button>

            <div className="premium-card">
              <h3>{selectedStudent.student_name}</h3>
              <p>Admission: {selectedStudent.admission_no}</p>
              <p>Score: {selectedStudent.score}</p>
            </div>

            {(selectedStudent.answers || []).map((q, i) => (
              <details key={i} className="premium-card">

                <summary style={{ fontWeight: 600 }}>
                  Q{i + 1}
                  <div style={{ marginTop: 5 }}>
                    {q.question}
                  </div>
                </summary>

                <div style={{ marginTop: 15 }}>

                  <h4>Student Answer</h4>
                  <ExpandableText text={q.student_answer} />

                  <h4>Correct Answer</h4>
                  <ExpandableText text={q.correct_answer} />

                  <p><b>AI Marks:</b> {q.marks_obtained}</p>

                  <p>
                    <b>Final Marks:</b>{" "}
                    {q.manual_evaluation
                      ? q.manual_marks
                      : q.marks_obtained}
                  </p>

                  {q.manual_evaluation && (
                    <p style={{ color: "green" }}>
                      ✔ Manually Evaluated
                    </p>
                  )}

                  <input
                    type="number"
                    placeholder="Manual Marks"
                    value={q.manual_marks || ""}
                    onChange={(e) =>
                      handleManualMarksChange(e.target.value, i, i)
                    }
                  />

                  <button
                    className="button"
                    onClick={() => saveEvaluation(q, i)}
                  >
                    Save Evaluation
                  </button>

                </div>
              </details>
            ))}
          </div>
        )}

      </section>
    </main>
  )
}