import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux'
import { uiActions } from '../store/uiSlice'
import { UserContext } from '../context/userContext';

const formatDateTime = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getElectionPhase = (startTime, endTime, now = new Date()) => {
  if (!startTime || !endTime) {
    return { key: "unscheduled", label: "Unscheduled" };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { key: "unscheduled", label: "Unscheduled" };
  }

  if (now < start) {
    return { key: "upcoming", label: "Upcoming" };
  }

  if (now > end) {
    return { key: "closed", label: "Closed" };
  }

  return { key: "live", label: "Live" };
};

const Election = ({ id, title, description, thumbnail, startTime, endTime }) => {
  const dispatch = useDispatch()
  const { currentUser } = useContext(UserContext);
  const isAdmin = currentUser?.isAdmin || currentUser?.voter?.isAdmin;
  const [timeLeft, setTimeLeft] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!startTime || !endTime) {
        setStatus("");
        setTimeLeft("");
        return 0;
      }

      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setStatus("");
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
    }, 1000);

    // Initial calculation
    calculateTimeLeft();

    return () => clearInterval(interval);
  }, [startTime, endTime]);
  
  const openModal = () => {
    // Pass the election data to the Redux store
    dispatch(uiActions.openUpdateElectionModal({
      id,
      title,
      description,
      startTime,
      endTime,
      thumbnail
    }));
  }

  const phase = getElectionPhase(startTime, endTime);

  return (
    <article className="election">
      <div className="election_image">
        <img src={thumbnail} alt={title} />
      </div>

      <div className="election_info">
        <div className="election_top">
          <Link to={`/elections/${id}`}>
            <h4>{title}</h4>
          </Link>
          <span className={`election_badge election_badge--${phase.key}`}>
            {phase.label}
          </span>
        </div>
        
        {status && (
          <div className="election_timer">
            <strong>{status}</strong> {timeLeft}
          </div>)}

        <p className="election_description">
          {description?.length > 255
            ? description.substring(0, 255) + '...'
            : description}
        </p>

        <div className="election_meta">
          <div>
            <span className="election_meta-label">Starts</span>
            <span className="election_meta-value">{formatDateTime(startTime)}</span>
          </div>
          <div>
            <span className="election_meta-label">Ends</span>
            <span className="election_meta-value">{formatDateTime(endTime)}</span>
          </div>
        </div>

        <div className="election_cta">
          <Link to={`/elections/${id}`} className="btn sm">
            View Election
          </Link>
          {isAdmin && (
            <button className="btn sm primary" onClick={openModal}>Edit Election</button>
          )}
        </div>
      </div>
    </article>
  );
};

export default Election;
