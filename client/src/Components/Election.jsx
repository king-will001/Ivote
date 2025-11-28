import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import { uiActions } from '../store/uiSlice'

const Election = ({ id, title, description, thumbnail, startDate, endDate }) => {
  const dispatch = useDispatch()
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (now < start) {
        setStatus("Starts in:");
        return start - now;
      } else if (now < end) {
        setStatus("Ends in:");
        return end - now;
      } else {
        setStatus("Ended");
        setTimeLeft("");
        return 0;
      }
    };

    const interval = setInterval(() => {
      const difference = calculateTimeLeft();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        clearInterval(interval);
      }
    }, 1000);

    // Initial calculation
    calculateTimeLeft();

    return () => clearInterval(interval);
  }, [startDate, endDate]);
  
  const openModal = () => {
    // Pass the election data to the Redux store
    dispatch(uiActions.openUpdateElectionModal({
      id,
      title,
      description,
      startDate,
      endDate,
      thumbnail
    }));
  }

  return (
    <article className="election">
      <div className="election_image">
        <img src={thumbnail} alt={title} />
      </div>

      <div className="election_info">
        <Link to={`/elections/${id}`}>
          <h4>{title}</h4>
        </Link>
        
        {status && (
          <div className="election_timer">
            <strong>{status}</strong> {timeLeft}
          </div>)}

        <p>
          {description?.length > 255
            ? description.substring(0, 255) + '...'
            : description}
        </p>

        <div className="election_cta">
          <Link to={`/elections/${id}`} className="btn sm">
            View Election
          </Link>
          <button className="btn sm primary" onClick={openModal}>Edit Election</button>
        </div>
      </div>
    </article>
  );
};

export default Election;
