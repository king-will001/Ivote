import React, { useState, useEffect } from 'react';
import { fetchCandidates, castVote } from '../utils/apiSimulator';

const ConfirmVote = ({
  electionId,
  candidateId,
  onCancel = () => {},
  onConfirm = () => {},
}) => {
  const [modalCandidate, setModalCandidate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const getCandidate = async () => {
      try {
        const response = await fetchCandidates(electionId);
        if (response.success) {
          const foundCandidate = response.data.find(
            (candidate) => candidate.id === candidateId
          );
          if (foundCandidate) {
            setModalCandidate(foundCandidate);
          } else {
            setError('Candidate not found.');
          }
        } else {
          setError(response.message || 'Candidate not found.');
        }
      } catch (err) {
        setError('Failed to fetch candidate information.');
      } finally {
        setIsLoading(false);
      }
    };

    getCandidate();
  }, [electionId, candidateId]);

  const handleConfirmVote = async () => {
    setIsVoting(true);
    setError(null);

    try {
      const response = await castVote(electionId, candidateId);
      if (response.success) {
        onConfirm(response.data);
      } else {
        setError(response.message || 'Failed to cast vote.');
      }
    } catch (err) {
      setError('Failed to cast vote.');
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <section className='modal' role='dialog' aria-modal='true'>
        <div className='modal_content confirm_vote-content confirm_vote-content--notice'>
          <span className='confirm_vote-kicker'>Preparing ballot</span>
          <h2>Loading candidate details</h2>
          <p className='confirm_vote-status'>Please wait while we prepare your vote.</p>
        </div>
      </section>
    );
  }

  if (error || !modalCandidate) {
    const message = error || 'Candidate not found.';
    return (
      <section className='modal' role='dialog' aria-modal='true'>
        <div className='modal_content confirm_vote-content confirm_vote-content--notice'>
          <div className='confirm_vote-error-card'>
            <span className='confirm_vote-error-title'>Unable to vote</span>
            <p className='confirm_vote-error'>{message}</p>
          </div>
          <p className='confirm_vote-status'>
            Close this window and try again from the candidate list.
          </p>
          <div className='confirm_vote-cta confirm_vote-cta-error'>
            <button className='btn confirm_vote-exit' onClick={onCancel} type='button'>
              Close
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='modal' role='dialog' aria-modal='true'>
      <div className='modal_content confirm_vote-content'>
        <div className='confirm_vote-header'>
          <span className='confirm_vote-kicker'>Confirm vote</span>
          <h2>
            You are voting for <strong>{modalCandidate.fullName}</strong>
          </h2>
          <p>
            Please confirm this selection. This action is final and cannot be undone.
          </p>
        </div>

        <div className='confirm_vote-card'>
          <div className='confirm_vote-image'>
            <img src={modalCandidate.image} alt={modalCandidate.fullName} />
          </div>
          <div className='confirm_vote-details'>
            <h3>{modalCandidate.fullName}</h3>
            <p className='confirm_vote-motto'>
              {modalCandidate?.motto ? modalCandidate.motto : 'No manifesto provided.'}
            </p>
            <div className='confirm_vote-meta'>
              <span>Verified ballot</span>
              <span>One vote per election</span>
            </div>
          </div>
        </div>

        {error && <p className='confirm_vote-error'>{error}</p>}

        <div className='confirm_vote-cta'>
          <button className='btn' onClick={onCancel} disabled={isVoting} type='button'>
            Cancel
          </button>
          <button
            className='btn primary'
            onClick={handleConfirmVote}
            disabled={isVoting}
            type='button'
          >
            {isVoting ? 'Submitting...' : 'Confirm Vote'}
          </button>
        </div>

        <p className='confirm_vote-note'>
          Your vote is recorded securely and will be counted once the election closes.
        </p>
      </div>
    </section>
  );
};

export default ConfirmVote;
