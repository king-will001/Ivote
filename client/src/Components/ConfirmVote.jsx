import React, { useState, useEffect, useContext } from 'react';
import { fetchCandidates, castVote } from '../utils/apiSimulator'; // Import from simulator
import { UserContext } from '../context/userContext';
import Loader from './Loader';

const ConfirmVote = ({ electionId, candidateId, onCancel, onConfirm }) => {
  const [modalCandidate, setModalCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const { currentUser } = useContext(UserContext);

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
    const voterId = currentUser?.id || currentUser?.voter?.id;
    if (!voterId) {
      setError("Please sign in to vote.");
      setIsVoting(false);
      return;
    }

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
    return (
      <section className="modal">
        <div className="modal_content confirm_vote-content">
          <Loader label="Loading candidate information..." size="sm" inline />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="modal">
        <div className="modal_content confirm_vote-content confirm_vote-content--notice">
          <div className="confirm_vote-error-card">
            <span className="confirm_vote-error-title">Vote not completed</span>
            <p className="confirm_vote-error">{error}</p>
          </div>
          <div className="confirm_vote-cta confirm_vote-cta-error">
            <button className="btn confirm_vote-exit" onClick={onCancel}>Exit</button>
          </div>
        </div>
      </section>
    );
  }

  if (!modalCandidate) {
    return (
      <section className="modal">
        <div className="modal_content confirm_vote-content confirm_vote-content--notice">
          <p className="confirm_vote-status">Candidate not found.</p>
          <div className="confirm_vote-cta confirm_vote-cta-error">
            <button className="btn confirm_vote-exit" onClick={onCancel}>Exit</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='modal'>
      <div className='modal_content confirm_vote-content'>
        <div className='confirm_vote-header'>
          <span className='confirm_vote-kicker'>Vote confirmation</span>
          <h2>Confirm your vote</h2>
          <p>
            You are about to submit your vote for{" "}
            <strong>{modalCandidate.fullName}</strong>. This action is final for
            this election.
          </p>
        </div>

        <div className='confirm_vote-card'>
          <div className='confirm_vote-image'>
            <img src={modalCandidate.image} alt={modalCandidate.fullName} />
          </div>
          <div className='confirm_vote-details'>
            <h3>{modalCandidate.fullName}</h3>
            <p className='confirm_vote-motto'>
              {modalCandidate?.motto?.length > 90
                ? modalCandidate?.motto?.substring(0, 90) + '...'
                : modalCandidate?.motto}
            </p>
            <div className='confirm_vote-meta'>
              <span>One vote per election</span>
              <span>Review before submit</span>
            </div>
          </div>
        </div>

        {error && <p className='confirm_vote-error'>{error}</p>}
        <div className='confirm_vote-cta'>
          <button className='btn' onClick={onCancel} disabled={isVoting}>Cancel</button>
          <button className='btn primary' onClick={handleConfirmVote} disabled={isVoting}>
            {isVoting ? 'Voting...' : 'Confirm Vote'}
          </button>
        </div>
        <p className='confirm_vote-note'>
          Your vote is recorded immediately after confirmation.
        </p>
      </div>
    </section>
  );
};

export default ConfirmVote;
