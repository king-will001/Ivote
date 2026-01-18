import React from 'react';
import { Link } from 'react-router-dom';
import CandidateRating from '../Components/CandidateRating';

const formatDateTime = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString();
};

const ResultElection = ({
  id,
  thumbnail,
  title,
  candidates = [],
  totalVotes = 0,
  startTime,
  endTime,
  showCandidates = undefined,
  status = 'final'
}) => {
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const normalizedStatus = ['final', 'live', 'pending'].includes(status) ? status : 'final';
  const isFinal = normalizedStatus === 'final';
  const isLive = normalizedStatus === 'live';
  const showCandidateList = typeof showCandidates === 'boolean' ? showCandidates : normalizedStatus !== 'pending';
  const endLabel = formatDateTime(endTime);
  const startLabel = formatDateTime(startTime);
  const badgeLabel = isFinal ? 'Final results' : isLive ? 'Live results' : 'Results pending';
  const metaLabel = isFinal
    ? `Ended ${endLabel}`
    : normalizedStatus === 'pending'
      ? `Starts ${startLabel}`
      : `Ends ${endLabel}`;

  return (
    <article className={`result result--${normalizedStatus}`}>
      <header className='result_header'>
        <div className='result_header-copy'>
          <span className={`result_badge result_badge--${normalizedStatus}`}>
            {badgeLabel}
          </span>
          <h4>{title}</h4>
          <p className='result_meta'>
            {metaLabel}
          </p>
        </div>
        <div className='result_header-image'>
          <img src={thumbnail} alt={title} />
        </div>
      </header>

      {showCandidateList ? (
        <div className='result_body'>
          <div className='result_summary'>
            <span>Total votes</span>
            <strong>{totalVotes}</strong>
          </div>
          <ul className='result_list'>
            {sortedCandidates.length === 0 ? (
              <li className='result_empty'>No candidates found.</li>
            ) : (
              sortedCandidates.map((candidate, index) => (
                <CandidateRating
                  key={candidate.id}
                  {...candidate}
                  totalVotes={totalVotes}
                  isWinner={index === 0 && totalVotes > 0}
                />
              ))
            )}
          </ul>
        </div>
      ) : (
        <div className='result_pending'>
          <p>Results will be published automatically after voting closes.</p>
        </div>
      )}

      <div className='result_footer'>
        <Link to={`/elections/${id}/candidates`} className='btn primary full'>
          {showCandidates ? 'View candidates' : 'Enter election'}
        </Link>
      </div>
    </article>
  );
};

export default ResultElection;
