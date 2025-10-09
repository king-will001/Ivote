import React, { useState, useEffect } from 'react';
import { candidates } from '../Data';
import { useDispatch } from 'react-redux';
import { uiActions } from '../store/uiSlice';

const ConfirmVote = ({ candidateId, onCancel, onConfirm }) => {
  const dispatch = useDispatch()
  //close confirm vote modal
  const closeCandidateModal = () => {
    dispatch(uiActions.closeVoteCandidateModal())
  }

  const [modalCandidate, setModalCandidate] = useState(null);

  // Move the function inside useEffect to avoid dependency warnings
  useEffect(() => {
    const fetchCandidate = () => {
      const foundCandidate = candidates.find(candidate => candidate.id === candidateId);
      if (foundCandidate) {
        setModalCandidate(foundCandidate);
      }
    };

    fetchCandidate();
  }, [candidateId]);

  if (!modalCandidate) {
    return <p>Loading candidate information...</p>;
  }

  return (
    <section className='modal'>
<<<<<<< HEAD
      <div className='modal-content confirm_vote-content'>
        <h5>Please confirm your vote</h5>
        <h2>Are you sure you want to vote for {modalCandidate.fullName}?</h2>
=======
      <div className='modal_content confirm_vote-content'>
        <h5>Please confirm your vote</h5>
        <h2>Are you sure you want to vote for <span>{modalCandidate.fullName}</span>?</h2>
>>>>>>> ec0264508e298f016f45f9009f6a6dd6b531e3d1
        <div className='confirm_vote-image'>
          <img src={modalCandidate.image} alt={modalCandidate.fullName} />
        </div>
        <p>{modalCandidate?.motto?.length > 50 ? modalCandidate?.motto?.substring(0, 50) + '...' : modalCandidate?.motto}</p>
        <div className='confirm_vote-cta'>
          <button className='btn' onClick={onCancel}>Cancel</button>
          <button className='btn primary' onClick={onConfirm}>Confirm Vote</button>
        </div>
      </div>
    </section>
  );
};

export default ConfirmVote;
