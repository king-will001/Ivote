import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { createElection } from '../utils/apiSimulator';
import classes from './AddElectionModal.module.css'; // Import CSS module

const AddElectionModal = ({ onClose = () => {}, onElectionAdded = () => {} }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic client-side validation
    if (!title.trim() || !description.trim() || !startDate || !endDate || !thumbnail) {
      setError("All fields are required.");
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

    const newElection = {
      title,
      description,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      thumbnail: thumbnail ? URL.createObjectURL(thumbnail) : null,
    };

    try {
      const response = await createElection(newElection);
      if (response.success) {
        onElectionAdded(response.data);
        // Reset form
        setTitle("");
        setDescription("");
        setStartDate("");
        setEndDate("");
        setThumbnail(null);
        onClose();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to create election.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={classes.modalOverlay} role="dialog" aria-modal="true">
      <div className={classes.modalContent}>
          <header className={classes.modalHeader}>
          <h4>Create New Election</h4>
          <button className={classes.modalCloseButton} onClick={onClose} aria-label="Close modal" disabled={isLoading} type="button">
            <IoMdClose />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={classes.modalForm}>
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
          <div>
            <h6>Election Title:</h6>
            <input
              type='text'
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <h6>Description:</h6>
            <textarea
              required
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
            <h6>Thumbnail:</h6>
            <input
              type='file'
              accept="image/*"
              required
              onChange={(e) => setThumbnail(e.target.files[0])}
              disabled={isLoading}
            />
          </div>

          <div className={classes.modalFooter}>
            <button type='button' className='btn' onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Election'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddElectionModal;
