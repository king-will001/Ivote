import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { candidates } from '../Data';
import CandidateRating from '../Components/CandidateRating';

const ResultElection = ({ id, thumbnail, title }) => {
  const [electionCandidates, setElectionCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    const filtered = candidates.filter(candidate => candidate.election === id);
    const sorted = [...filtered].sort((a, b) => b.voteCount - a.voteCount);
    setElectionCandidates(sorted);

    const total = sorted.reduce((sum, candidate) => sum + (candidate.voteCount || 0), 0);
    setTotalVotes(total);
  }, [id]);

  return (
    <article className='result'>
      <header className='result_header'>
        <h4>{title}</h4>
        <div className='result_header-image'>
          <img src={thumbnail} alt={title} />
        </div>
      </header>
      <ul className='result_list'>
        {electionCandidates.length === 0 ? (
          <li>No candidates found.</li>
        ) : (
          electionCandidates.map(candidate => (
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
