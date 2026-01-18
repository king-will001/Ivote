import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchElectionStats } from '../utils/apiSimulator';
import RealTimeResults from '../Components/RealTimeResults';
import Loader from '../Components/Loader';
import './ElectionAnalytics.css';

const ElectionAnalytics = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetchElectionStats(id);
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.message || 'Failed to load election statistics');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [id]);

  if (loading) return <Loader label="Loading Election Analytics..." fullPage />;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return <div className="empty-state">No data available</div>;

  return (
    <div className="election-analytics-page">
      <div className="analytics-header">
        <h1>{stats.electionTitle}</h1>
        <div className={`phase-indicator phase-${stats.phase}`}>
          {stats.phase.charAt(0).toUpperCase() + stats.phase.slice(1)}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Votes</div>
          <div className="metric-value">{stats.totalVotes}</div>
          <div className="metric-icon">🗳️</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Voter Turnout</div>
          <div className="metric-value">{stats.votePercentage}%</div>
          <div className="metric-icon">📊</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Candidates</div>
          <div className="metric-value">{stats.totalCandidates}</div>
          <div className="metric-icon">👥</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Eligible Voters</div>
          <div className="metric-value">{stats.totalEligibleVoters}</div>
          <div className="metric-icon">📋</div>
        </div>
      </div>

      {/* Real-time Results */}
      <div className="results-section">
        <RealTimeResults electionId={id} />
      </div>

      {/* Detailed Candidate Analytics */}
      <div className="candidate-analytics">
        <h2>Candidate Performance</h2>
        <div className="analytics-table">
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Candidate Name</th>
                <th>Votes</th>
                <th>Percentage</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {stats.candidates.map((candidate, index) => (
                <tr key={candidate.candidateId}>
                  <td className="rank">#{index + 1}</td>
                  <td className="name">{candidate.candidateName}</td>
                  <td className="votes">{candidate.voteCount}</td>
                  <td>
                    <div className="percentage-bar">
                      <div 
                        className="bar-fill"
                        style={{ width: `${candidate.percentage}%` }}
                      />
                      <span>{candidate.percentage}%</span>
                    </div>
                  </td>
                  <td className="trend">
                    <span className={`trend-badge ${candidate.trend}`}>
                      {candidate.trend === 'up' && '📈'}
                      {candidate.trend === 'down' && '📉'}
                      {candidate.trend === 'stable' && '➡️'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ElectionAnalytics;
