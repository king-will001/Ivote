import React, { useState } from 'react';
// Candidate is a presentational component; vote actions are triggered by parent

const Candidate = ({ image, id, fullName, motto, onVote }) => {

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
        <button className='btn primary' onClick={onVote}>Vote</button>
      </article>
      {/* ConfirmVote is rendered by the page (Candidates) using global UI/vote state */}
    </>
  );
};

export default Candidate;
