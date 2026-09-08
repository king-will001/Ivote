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
    <article className='candidate reveal'>
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
          <div className="candidate_image-placeholder">
            <span>No image available</span>
          </div>
        )}
      </div>
      <h5>{fullName?.length > 20 ? fullName.substring(0, 20) + '…' : fullName}</h5>
      <small>{motto?.length > 30 ? motto.substring(0, 30) + '…' : motto}</small>
      <button
        type="button"
        className='btn primary'
        onClick={onVote}
        aria-label={`Vote for ${fullName}`}
      >
        Vote
      </button>
    </article>
  );
};

export default Candidate;
