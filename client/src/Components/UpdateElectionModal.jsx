import React, { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';
import { updateElection } from '../utils/apiSimulator';
import classes from './AddElectionModal.module.css'; // Reuse styles from AddElectionModal

const UpdateElectionModal = ({ onClose, onElectionUpdated, electionData }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to format ISO date string to datetime-local input format
  const formatToDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    // The slice(0, 16) is to remove seconds and timezone info, which datetime-local doesn't use.
    return new Date(isoString).toISOString().slice(0, 16);
  };

  // Prefill form when electionData is available
  useEffect(() => {
    if (electionData) {
      setTitle(electionData.title || "");
      setDescription(electionData.description || "");
      setStartDate(formatToDateTimeLocal(electionData.startDate));
      setEndDate(formatToDateTimeLocal(electionData.endDate));
    }
  }, [electionData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!title.trim() || !description.trim() || !startDate || !endDate) {
      setError("All fields except thumbnail are required.");
      setIsLoading(false);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError("End date and time must be after the start date and time.");
      setIsLoading(false);
      return;
    }

    const updatedData = {
      id: electionData.id,
      title,
      description,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      // Only include thumbnail if a new one was selected
      ...(thumbnail && { thumbnail: URL.createObjectURL(thumbnail) }),
    };

    try {
      const response = await updateElection(updatedData);
      if (response.success) {
        onElectionUpdated(response.data);
        onClose();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to update election.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={classes.modalOverlay} role="dialog" aria-modal="true">
      <div className={classes.modalContent}>
        <header className={classes.modalHeader}>
          <h4>Update Election</h4>
          <button className={classes.modalCloseButton} onClick={onClose} aria-label="Close modal" disabled={isLoading}>
            <IoMdClose />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={classes.modalForm}>
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
          <div>
            <h6>Election Title:</h6>
            <input
              type='text'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <h6>Description:</h6>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <h6>Start Date & Time:</h6>
            <input
              type='datetime-local'
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <h6>End Date & Time:</h6>
            <input
              type='datetime-local'
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <h6>Thumbnail (leave empty to keep current):</h6>
            <input
              type='file'
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0])}
              disabled={isLoading}
            />
          </div>

          <div className={classes.modalFooter}>
            <button type='button' className='btn' onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Election'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default UpdateElectionModal;
