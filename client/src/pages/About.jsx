import React from 'react';
import { Link } from 'react-router-dom';

function About() {
  return (
    <section className="about">
      <div className="container about_hero">
        <div className="about_hero-copy">
          <span className="about_kicker">About IvoTe</span>
          <h1>Secure, transparent elections for modern communities.</h1>
          <p>
            IvoTe is built to make elections simple, verifiable, and accessible. Our platform
            combines identity checks, clear audit trails, and a voter-first experience so every
            voice is counted with confidence.
          </p>
          <div className="about_actions">
            <Link to="/elections" className="btn primary">Explore elections</Link>
            <Link to="/results" className="btn">View results</Link>
          </div>
        </div>

        <div className="about_hero-card">
          <h3>What we prioritize</h3>
          <ul>
            <li>Verified voter access with OTP and email confirmation.</li>
            <li>Real-time reporting with clear result summaries.</li>
            <li>Accessible design that works on every device.</li>
          </ul>
        </div>
      </div>

      <div className="container about_values">
        <article className="about_card">
          <h4>Security-first</h4>
          <p>
            We enforce strict authentication flows and keep data handling transparent, so admins
            and voters can trust every step.
          </p>
        </article>
        <article className="about_card">
          <h4>Transparent outcomes</h4>
          <p>
            Results are delivered with clear breakdowns, helping stakeholders validate the final
            outcome without friction.
          </p>
        </article>
        <article className="about_card">
          <h4>Inclusive access</h4>
          <p>
            Mobile-first screens, readable layouts, and focused workflows keep the experience
            intuitive for all voters.
          </p>
        </article>
      </div>
    </section>
  );
}

export default About;
