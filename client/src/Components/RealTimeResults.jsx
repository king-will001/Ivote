import React, { useState, useEffect } from 'react';
import { fetchLiveResults } from '../utils/apiSimulator';
import './RealTimeResults.module.css';

const RealTimeResults = ({ electionId }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const loadResults = async () => {
      try {
        const response = await fetchLiveResults(electionId);
        if (response.success) {
          setResults(response.data);
          setLastUpdated(new Date());
        } else {
          setError('Failed to load results');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
    // Auto-refresh every 5 seconds
    const interval = setInterval(loadResults, 5000);
    return () => clearInterval(interval);
  }, [electionId]);

  if (loading) return <div className="loading">Loading results...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!results) return <div className="empty">No results available</div>;

  const { results: candidateResults, totalVotes } = results;
  const winner = candidateResults[0];

  return (
    <div className="real-time-results">
      <div className="results-header">
        <h2>Live Election Results</h2>
        <div className="last-updated">
          Last updated: {lastUpdated?.toLocaleTimeString()}
        </div>
      </div>

      <div className="total-votes">
        <span className="label">Total Votes Cast:</span>
        <span className="value">{totalVotes}</span>
      </div>

      {candidateResults.length > 0 && (
        <div className="winner-spotlight">
          <div className="winner-badge">Leading</div>
          <div className="winner-info">
            {winner.candidateImage && (
              <img 
                src={winner.candidateImage} 
                alt={winner.candidateName}
                className="winner-image"
              />
            )}
            <div className="winner-details">
              <h3>{winner.candidateName}</h3>
              <p className="vote-count">{winner.voteCount} votes</p>
              <p className="percentage">{winner.percentage}%</p>
            </div>
          </div>
        </div>
      )}

      <div className="results-list">
        {candidateResults.map((result, index) => (
          <div key={result.candidateId} className="result-item">
            <div className="rank-badge">{index + 1}</div>
            
            {result.candidateImage && (
              <img 
                src={result.candidateImage} 
                alt={result.candidateName}
                className="candidate-image"
              />
            )}

            <div className="candidate-info">
              <h4>{result.candidateName}</h4>
              <div className="vote-bar">
                <div 
                  className="bar-fill"
                  style={{ width: `${result.percentage}%` }}
                >
                  {result.percentage > 10 && (
                    <span className="bar-label">{result.percentage}%</span>
                  )}
                </div>
              </div>
              <div className="vote-details">
                <span className="vote-count">{result.voteCount} votes</span>
                <span className="percentage">{result.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealTimeResults;
