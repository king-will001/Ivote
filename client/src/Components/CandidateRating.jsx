import React from 'react';

const CandidateRating = ({ fullName, image, voteCount = 0, totalVotes = 0, isWinner = false }) => {
  const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

  return (
    <li className={`result_candidate ${isWinner ? 'is-winner' : ''}`}>
      <div className="result_candidate-image">
        <img src={image} alt={fullName} />
      </div>
      <div className="result_candidate-info">
        <div className="result_candidate-header">
          <h5>{fullName}</h5>
          {isWinner && <span className="result_candidate-badge">Leading</span>}
        </div>
        <small>{`${voteCount} ${voteCount === 1 ? "vote" : "votes"}`}</small>
        <div className="result_candidate-rating">
          <div className="result_candidate-loader">
            <span style={{ width: `${percentage}%` }}></span>
          </div>
          <small>{`${percentage.toFixed(2)}%`}</small>
        </div>
      </div>
    </li>
  );
};

export default CandidateRating;
