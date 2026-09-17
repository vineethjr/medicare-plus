import { Link } from "react-router-dom";
import "./App.css";

function Home() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">
          MediCare<span>+</span>
        </div>

        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <Link to="/login" className="login-btn">
            Login
          </Link>
        </div>
      </nav>

      <main className="hero">
        <section className="hero-content">
          <p className="tagline">SMARTER HEALTHCARE, BETTER LIVING</p>

          <h1>
            Your Health.
            <br />
            Our <span>Priority.</span>
          </h1>

          <p className="description">
            Find the right doctor, manage appointments, and access healthcare
            services—all in one simple platform.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-btn">
              Get Started
            </Link>

            <a href="#features" className="secondary-btn">
              Explore Features
            </a>
          </div>
        </section>

        <section className="hero-visual">
          <div className="health-card">
            <div className="health-icon">♥</div>
            <h3>Your Health Matters</h3>
            <p>Connected care made simple.</p>
          </div>
        </section>
      </main>

      <section id="features" className="features">
        <h2>Everything You Need for Better Care</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Doctor Recommendation</h3>
            <p>Get doctor suggestions based on your symptoms.</p>
          </div>

          <div className="feature-card">
            <h3>Easy Appointments</h3>
            <p>Book and manage appointments without hassle.</p>
          </div>

          <div className="feature-card">
            <h3>Digital Prescription</h3>
            <p>Access your prescriptions digitally whenever needed.</p>
          </div>
        </div>
      </section>

      <footer id="about">
        <p>© 2026 MediCare+. Healthcare made simpler.</p>
      </footer>
    </div>
  );
}

export default Home;