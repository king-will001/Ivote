import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux'
import { uiActions } from '../store/uiSlice'

const Election = ({
  id,
  title,
  description,
  thumbnail,
  startDate,
  endDate,
  startTime,
  endTime,
  onDelete,
  isDeleting = false,
}) => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth?.user)
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const start = new Date(startTime || startDate);
      const end = new Date(endTime || endDate);
      const startMs = start.getTime();
      const endMs = end.getTime();

      if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
        setStatus("Schedule TBD");
        setTimeLeft("");
        return 0;
      }

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
    }, 5000);

    // Initial calculation
    calculateTimeLeft();

    return () => clearInterval(interval);
  }, [startDate, endDate, startTime, endTime]);
  
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

  const handleDelete = () => {
    if (onDelete) {
      onDelete(id, title);
    }
  };

  let badgeLabel = '';
  let badgeClass = 'election_badge election_badge--unscheduled';

  if (status === "Starts in:") {
    badgeLabel = "Upcoming";
    badgeClass = "election_badge election_badge--upcoming";
  } else if (status === "Ends in:") {
    badgeLabel = "Live";
    badgeClass = "election_badge election_badge--live";
  } else if (status === "Ended") {
    badgeLabel = "Closed";
    badgeClass = "election_badge election_badge--closed";
  } else if (status === "Schedule TBD") {
    badgeLabel = "Unscheduled";
    badgeClass = "election_badge election_badge--unscheduled";
  }

  return (
    <article className="election">
      <div className="election_image">
        <img src={thumbnail} alt={title} loading="lazy" decoding="async" />
      </div>

      <div className="election_info">
        <div className="election_top">
          <Link to={`/elections/${id}`}>
            <h4>{title}</h4>
          </Link>
          {badgeLabel && <span className={badgeClass}>{badgeLabel}</span>}
        </div>

        {status && (
          <div className="election_timer">
            <strong>{status}</strong> {timeLeft}
          </div>
        )}

        <p>
          {description?.length > 255
            ? description.substring(0, 255) + '...'
            : description}
        </p>

        <div className="election_cta">
          <Link to={`/elections/${id}`} className="btn sm">
            View Election
          </Link>
          {user?.isAdmin && (
            <>
              <button className="btn sm primary" onClick={openModal} type="button">
                Edit Election
              </button>
              <button
                className="btn sm danger"
                onClick={handleDelete}
                type="button"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default Election;
