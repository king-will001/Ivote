import React, { useState, useEffect } from 'react';
import { fetchCandidates, castVote } from '../utils/apiSimulator'; // Import from simulator

const ConfirmVote = ({ electionId, candidateId, onCancel, onConfirm }) => {
  const [modalCandidate, setModalCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const getCandidate = async () => {
      try {
        const response = await fetchCandidates(electionId); // Fetch candidates for the specific election
        if (response.success) {
          const foundCandidate = response.data.find(candidate => candidate.id === candidateId);
          if (foundCandidate) {
            setModalCandidate(foundCandidate);
          } else {
            setError("Candidate not found.");
          }
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError("Failed to fetch candidate information.");
      } finally {
        setIsLoading(false);
      }
    };

    getCandidate();
  }, [electionId, candidateId]);

  const handleConfirmVote = async () => {
    setIsVoting(true);
    setError(null);
    // For now, we'll use a hardcoded voterId. In a real app, this would come from authenticated user context.
    const voterId = "v2"; // Example: Ndanm Boseh Prince-will

    try {
      const response = await castVote(electionId, candidateId, voterId);
      if (response.success) {
        onConfirm(response.data); // Pass any relevant data back to parent
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to cast vote.");
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return <section className="modal"><div className="modal_content confirm_vote-content">Loading candidate information...</div></section>;
  }

  if (error) {
    return <section className="modal"><div className="modal_content confirm_vote-content" style={{color: 'red'}}>Error: {error}</div></section>;
  }

  if (!modalCandidate) {
    return <section className="modal"><div className="modal_content confirm_vote-content">Candidate not found.</div></section>;
  }

  return (
    <section className='modal'>
      <div className='modal_content confirm_vote-content'>
        <h5>Please confirm your vote</h5>
        <h2>Are you sure you want to vote for <span>{modalCandidate.fullName}</span>?</h2>
        <div className='confirm_vote-image'>
          <img src={modalCandidate.image} alt={modalCandidate.fullName} />
        </div>
        <p>{modalCandidate?.motto?.length > 50 ? modalCandidate?.motto?.substring(0, 50) + '...' : modalCandidate?.motto}</p>
        {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
        <div className='confirm_vote-cta'>
          <button className='btn' onClick={onCancel} disabled={isVoting}>Cancel</button>
          <button className='btn primary' onClick={handleConfirmVote} disabled={isVoting}>
            {isVoting ? 'Voting...' : 'Confirm Vote'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConfirmVote;
