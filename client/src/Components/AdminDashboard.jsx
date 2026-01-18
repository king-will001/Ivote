import React, { useState, useEffect } from 'react';
import { fetchDashboardStats } from '../utils/apiSimulator';
import Loader from './Loader';
import './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetchDashboardStats();
        if (response.success) {
          setDashboardData(response.data);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // Refresh every 10 seconds
    const interval = setInterval(loadDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader label="Loading Dashboard..." fullPage />;
  if (error) return <div className="error-message">{error}</div>;
  if (!dashboardData) return <div className="empty-state">No data available</div>;

  const { summary, elections } = dashboardData;

  return (
    <div className="admin-dashboard">
      <h1 className="dashboard-title">Admin Dashboard</h1>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-value">{summary.totalElections}</div>
          <div className="stat-label">Total Elections</div>
          <div className="stat-icon">📊</div>
        </div>
        <div className="stat-card active">
          <div className="stat-value">{summary.activeElections}</div>
          <div className="stat-label">Active Elections</div>
          <div className="stat-icon">🔴</div>
        </div>
        <div className="stat-card upcoming">
          <div className="stat-value">{summary.upcomingElections}</div>
          <div className="stat-label">Upcoming Elections</div>
          <div className="stat-icon">⏰</div>
        </div>
        <div className="stat-card closed">
          <div className="stat-value">{summary.closedElections}</div>
          <div className="stat-label">Closed Elections</div>
          <div className="stat-icon">✓</div>
        </div>
        <div className="stat-card votes">
          <div className="stat-value">{summary.totalVotes}</div>
          <div className="stat-label">Total Votes Cast</div>
          <div className="stat-icon">🗳️</div>
        </div>
      </div>

      {/* Elections Table */}
      <div className="elections-table-container">
        <h2>Elections Overview</h2>
        <table className="elections-table">
          <thead>
            <tr>
              <th>Election Title</th>
              <th>Status</th>
              <th>Votes Cast</th>
              <th>Voter Turnout</th>
              <th>Candidates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {elections.map((election) => (
              <tr key={election.electionId} className={`phase-${election.phase}`}>
                <td className="election-title">{election.title}</td>
                <td>
                  <span className={`phase-badge phase-${election.phase}`}>
                    {election.phase.charAt(0).toUpperCase() + election.phase.slice(1)}
                  </span>
                </td>
                <td>{election.totalVotes}</td>
                <td>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${election.votePercentage}%` }}
                    />
                  </div>
                  <span className="percentage">{election.votePercentage}%</span>
                </td>
                <td>{election.totalCandidates}</td>
                <td>
                  <button className="action-btn view-btn">View Stats</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
