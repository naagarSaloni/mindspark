 import "./Home.css";
import bgImage from "../assets/home.png";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  return (
    
    <section
      className="home-hero"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="home-overlay"></div>

      <div className="home-content">
        <div className="home-left">
          <h1>
            Smart AI-Based
            <br />
            Assessment <span>Platform</span>
          </h1>

          <p>
            Create, deliver, and evaluate assessments with AI
            <br />
            that understands every answer.
          </p>

          <div className="home-buttons">
            <button
  className="hero-btn primary"
  onClick={() => navigate("/register")}
>
  Get Started
</button>
            
          </div>
        </div>

        <div className="home-right">
          <div className="floating-card small card-one">
            <h4>Real-time</h4>
            <p>Evaluation</p>
          </div>

          <div className="floating-card small card-two">
            <h4>Smart</h4>
            <p>Analytics</p>
          </div>

          <div className="floating-card main-card">
            <h3>Analyzing Answers...</h3>

            <div className="stats-row">
              <div>
                <strong>92%</strong>
                <span>Accuracy</span>
              </div>
              <div>
                <strong>Live</strong>
                <span>Performance</span>
              </div>
              <div>
                <strong>AI</strong>
                <span>Insights</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

export default Home;