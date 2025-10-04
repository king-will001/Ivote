import React, { useState } from 'react';
import ConfirmVote from './ConfirmVote';
import { useDispatch } from 'react-redux';
import { uiActions } from '../store/uiSlice';
import { voteActions } from '../store/vote-slice';

const Candidate = ({ image, id, fullName, motto }) => {
  const dispatch = useDispatch()

  // open confirm vote model
  const openCandidateModal = () => {
    dispatch(uiActions.openVoteCandidateModal())
    dispatch(voteActions.changeSelectedVoteCandidate(id))
  }
  const [showConfirm, setShowConfirm] = useState(false);

  const handleVoteClick = () => {
    setShowConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    // TODO: Add vote confirmation logic here, e.g., dispatch Redux action or update state
    console.log(`Vote confirmed for candidate id: ${id}`);
  };

  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <>
      <article className='candidate'>
        <div className='candidate_image'>
          {!imageError ? (
            <img
              src={image}
              alt={fullName}
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              style={{ opacity: imageLoaded ? 1 : 0 }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'var(--color-gray-200)',
              color: 'var(--color-gray-500)',
              fontSize: '0.8rem',
              textAlign: 'center',
              padding: '1rem'
            }}>
              <span>No Image</span>
            </div>
          )}
        </div>
        <h5>{fullName?.length > 20 ? fullName.substring(0, 20) + '...' : fullName}</h5>
        <small>{motto?.length > 30 ? motto.substring(0, 30) + '...' : motto}</small>
        <button className='btn primary' onClick={handleVoteClick}>Vote</button>
      </article>
      {showConfirm && (
        <ConfirmVote
          candidateId={id}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};

export default Candidate;
