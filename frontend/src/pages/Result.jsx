 import { useEffect, useState } from "react";

function Result() {
  const [feedback, setFeedback] = useState(null);

  const result = JSON.parse(
    localStorage.getItem("lastResult") || "null"
  );

  // SAFE FALLBACKS
  const score = feedback?.score ?? result?.score ?? 0;
  const total = feedback?.total ?? result?.total ?? 0;
  const percentage = feedback?.percentage ?? result?.percentage ?? 0;

  const strengths = feedback?.strengths ?? [];
  const weaknesses = feedback?.weaknesses ?? [];

  const details = feedback?.details ?? result?.feedback ?? [];

  useEffect(() => {
    const attemptId = result?.attempt_id;
    if (!attemptId) return;

    fetch(
      `http://127.0.0.1:8000/api/attempts/attempt/${attemptId}/summary`
    )
      .then((res) => res.json())
      .then((data) => setFeedback(data))
      .catch((err) => console.log(err));
  }, [result?.attempt_id]);

  if (!result) {
    return (
      <main className="page container dashboard-page">
        <section className="panel result-panel empty-state">
          <h2>No Result Available</h2>
          <p>Please attempt an exam to see results here.</p>
        </section>
      </main>
    );
  }

  const getBadgeColor = (status) => {
    if (status === "Correct" || status === "Strong Answer") return "#16a34a";

    if (
      status === "Partial" ||
      status === "Good Answer" ||
      status === "Average Answer"
    )
      return "#f59e0b";

    return "#ef4444";
  };

  const avgPlagiarism =
    details.length > 0
      ? Math.round(
          details.reduce((sum, item) => sum + (item.plagiarism || 0), 0) /
            details.length
        )
      : 0;

  const avgAI =
    details.length > 0
      ? Math.round(
          details.reduce(
            (sum, item) => sum + (item.ai_probability || 0),
            0
          ) / details.length
        )
      : 0;

  return (
    <main className="page container dashboard-page">
      <section className="panel result-panel premium-result">
        {/* HEADER */}
        <div className="result-header">
          <div>
            <p className="eyebrow">Exam Result</p>
            <h2>Performance Dashboard</h2>
            <p className="subtext">
              Detailed breakdown of your answers, evaluation, and analysis
            </p>
          </div>

          <div className="score-circle">
            <svg width="120" height="120">
              <circle cx="60" cy="60" r="50" className="circle-bg" />

              <circle
                cx="60"
                cy="60"
                r="50"
                className="circle-progress"
                style={{
                  strokeDashoffset: 314 - (314 * percentage) / 100,
                }}
              />
            </svg>

            <div className="score-text">
              <strong>{percentage}%</strong>
              <span>Score</span>
            </div>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="summary-row premium-summary">
          <div className="summary-card">
            <span>Total Score</span>
            <strong>
              {score} / {total}
            </strong>
          </div>

          <div className="summary-card">
            <span>Percentage</span>
            <strong>{percentage}%</strong>
          </div>

          <div className="summary-card">
            <span>Avg. Plagiarism</span>
            <strong>{avgPlagiarism}%</strong>
          </div>

          <div className="summary-card">
            <span>Avg. AI Probability</span>
            <strong>{avgAI}%</strong>
          </div>
        </div>

        {/* QUESTIONS */}
        <div className="question-list premium-list">
          {details.length > 0 &&
            details.map((item, idx) => (
              <div key={idx} className="question-card premium-card">
                {/* QUESTION HEADER */}
                <div className="q-header">
                  <h3>
                    Q{idx + 1}. {item.question}
                  </h3>

                  <span
                    className="status-badge"
                    style={{
                      background: getBadgeColor(item.result),
                    }}
                  >
                    {item.result}
                  </span>
                </div>

                {/* ANALYTICS ROW */}
                <div className="evaluation-bar">
                  <div className="eval-stat">
                    <span>Marks</span>
                    <strong>
                      {item.marks_obtained || 0} / {item.max_marks || 0}
                    </strong>
                  </div>

                  <div className="eval-stat">
                    <span>Plagiarism</span>
                    <strong>{item.plagiarism || 0}%</strong>
                  </div>

                  <div className="eval-stat">
                    <span>AI Probability</span>
                    <strong>{item.ai_probability || 0}%</strong>
                  </div>

                  <div className="eval-stat">
                    <span>Result</span>
                    <strong>{item.result}</strong>
                  </div>
                </div>

                {/* YOUR ANSWER */}
                <div className="answer-box student">
                  <h4>Your Answer</h4>
                  <p>{item.student_answer || "Not Answered"}</p>
                </div>

                {/* IDEAL ANSWER */}
                <div className="answer-box ideal">
                  <h4>Ideal Answer</h4>
                  <p>{item.correct_answer || "N/A"}</p>
                </div>

                {/* FEEDBACK */}
                <div className="feedback-box answer-feedback">
                  <h4>Feedback</h4>
                  <p>{item.feedback || "No feedback available"}</p>
                </div>
              </div>
            ))}
        </div>

        {/* OVERALL FEEDBACK */}
        <div className="feedback-box overall-feedback">
          <h3>Overall Feedback</h3>

          <p>
            Score: {score} out of {total} ({percentage}%)
          </p>

          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <h4>Strengths:</h4>
              <ul>
                {[...new Set(strengths)].map((t, i) => (
                  <li key={i}>
                    Strong understanding of{" "}
                    {typeof t === "object" ? t.topic : t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <div>
              <h4>Areas for Improvement:</h4>
              <ul>
                {[...new Set(weaknesses)].map((t, i) => (
                  <li key={i}>
                    Revise {typeof t === "object" ? t.topic : t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendation */}
          {weaknesses.length > 0 && (
            <div>
              <h4>Recommendation:</h4>
              <p>
                Practice at least 5 questions from{" "}
                <b>
                  {[...new Set(weaknesses)]
                    .map((t) => (typeof t === "object" ? t.topic : t))
                    .join(", ")}
                </b>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Result;