import React, { useState } from 'react';
import { candidates as dummyCandidates } from '../Data';
import { useParams } from 'react-router-dom';
import CandidateCard from '../Components/Candidate';
import ConfirmVote from '../Components/ConfirmVote';
import { useSelector } from 'react-redux';

const Candidates = () => {
  const { id } = useParams(); // ✅ Define first
  console.log('Candidates Page Loaded', id); // ✅ Use after

  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const voteCandidateModalShowing = useSelector(
    (state) => state.ui.voteCandidateModalShowing
  );

  const candidates = dummyCandidates.filter(
    (candidate) => candidate.election === id
  );

  const handleVoteClick = (candidateId) => {
    setSelectedCandidateId(candidateId);
  };

  const handleCancel = () => {
    setSelectedCandidateId(null);
  };

  const handleConfirm = () => {
    console.log(`Vote confirmed for candidate ID: ${selectedCandidateId}`);
    setSelectedCandidateId(null);
  };

  return (
    <>
      <section className='candidates'>
        <header className='candidates_header'>
          <h1>Vote a candidate</h1>
          <p>
            Choose your favorite candidate. You can vote for one candidate per election.
            The candidate with the most votes will win the election.
          </p>
        </header>

        <div className='container candidates_container'>
          {candidates.length === 0 ? (
            <p>No candidates found for this election.</p>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                {...candidate}
                onVote={() => handleVoteClick(candidate.id)}
              />
            ))
          )}
        </div>
      </section>

      {voteCandidateModalShowing && selectedCandidateId && (
        <ConfirmVote
          candidateId={selectedCandidateId}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};

export default Candidates;
