import React from 'react';
import { Link } from 'react-router-dom';
import CandidateRating from '../Components/CandidateRating';

const ResultElection = ({ id, thumbnail, title, candidates, totalVotes }) => {
  // Sort candidates by vote count in descending order
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <article className='result'>
      <header className='result_header'>
        <h4>{title}</h4>
        <div className='result_header-image'>
          <img src={thumbnail} alt={title} />
        </div>
      </header>
      <ul className='result_list'>
        {sortedCandidates.length === 0 ? (
          <li>No candidates found.</li>
        ) : (
          sortedCandidates.map(candidate => (
            <CandidateRating key={candidate.id} {...candidate} totalVotes={totalVotes} />
          ))
        )}
      </ul>
      <Link to={`/elections/${id}/candidates`} className='btn primary full'>
        Enter Election
      </Link>
    </article>
  );
};

export default ResultElection;
