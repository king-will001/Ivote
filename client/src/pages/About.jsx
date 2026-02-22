import React from 'react'
import { Link } from 'react-router-dom'

function About() {
  return (
    <section className="about">
      <div className="container">
        <div className="about_hero">
          <div className="about_hero-copy">
            <span className="about_kicker">About IVote</span>
            <h1>Secure, transparent elections for every community.</h1>
            <p>
              IVote helps organizations run credible elections with verified voters,
              resilient infrastructure, and real-time insights.
            </p>
            <div className="about_actions">
              <Link className="btn primary" to="/elections">Explore elections</Link>
              <Link className="btn" to="/results">View results</Link>
            </div>
          </div>
          <div className="about_hero-card">
            <h3>What we deliver</h3>
            <ul>
              <li>Identity checks and role-based access</li>
              <li>Live dashboards for turnout and results</li>
              <li>Audit-ready records for compliance</li>
              <li>Mobile-first experiences for voters</li>
            </ul>
          </div>
        </div>

        <div className="about_values">
          <article className="about_card">
            <h4>Security by default</h4>
            <p>
              Multi-layer safeguards protect voter data and ensure every ballot is
              counted once.
            </p>
          </article>
          <article className="about_card">
            <h4>Transparent reporting</h4>
            <p>
              Publish trusted results with automatic tallying and verified vote totals.
            </p>
          </article>
          <article className="about_card">
            <h4>Accessible everywhere</h4>
            <p>
              Responsive, high-contrast interfaces keep the experience clear on any device.
            </p>
          </article>
          <article className="about_card">
            <h4>Operational support</h4>
            <p>
              Tools for admins and observers keep every election organized from launch to closure.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default About
