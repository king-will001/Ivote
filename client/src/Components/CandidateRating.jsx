import React from 'react';

const CandidateRating = ({
  fullName,
  image,
  voteCount,
  totalVotes,
  isWinner = false,
  badgeLabel = 'Winner',
}) => {
  const safeTotalVotes = Number.isFinite(Number(totalVotes)) ? Number(totalVotes) : 0;
  const safeVoteCount = Number.isFinite(Number(voteCount)) ? Number(voteCount) : 0;
  const percentage =
    safeTotalVotes > 0 ? (safeVoteCount / safeTotalVotes) * 100 : 0;

  return (
    <li className={`result_candidate${isWinner ? ' is-winner' : ''}`}>
      <div className="result_candidate-image">
        <img src={image} alt={fullName} loading="lazy" decoding="async" />
      </div>
      <div className="result_candidate-info">
        <div className="result_candidate-header">
          <div>
            <h5>{fullName}</h5>
            <small>{`${safeVoteCount} ${safeVoteCount === 1 ? "vote" : "votes"}`}</small>
          </div>
          {isWinner && <span className="result_candidate-badge">{badgeLabel}</span>}
        </div>
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
