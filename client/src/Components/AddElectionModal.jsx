import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { createElection } from '../utils/apiSimulator';
import classes from './AddElectionModal.module.css'; // Import CSS module

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Failed to read file"));
  reader.readAsDataURL(file);
});

const AddElectionModal = ({ onClose = () => {}, onElectionAdded = () => {} }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleThumbnailChange = async (event) => {
    const file = event.target.files?.[0] || null;
    setThumbnail(file);
    setError(null);

    if (!file) {
      setThumbnailPreview("");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setThumbnailPreview(typeof dataUrl === "string" ? dataUrl : "");
    } catch (err) {
      setThumbnailPreview("");
      setError("Failed to read the selected image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Basic client-side validation
    if (!title.trim() || !description.trim() || !startTime || !endTime || !thumbnail) {
      setError("All fields are required.");
      setIsLoading(false);
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      setError("End date and time must be after the start date and time.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('date', startTime.split('T')[0]);
    formData.append('startTime', start.toISOString());
    formData.append('endTime', end.toISOString());
    formData.append('banner', thumbnail); // File input

    try {
      const response = await fetch('/api/elections', {
        method: 'POST',
        body: formData, // Don't set Content-Type, browser will set it
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || `Error: ${response.status}`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      onElectionAdded(data.election || data);
      // Reset form
      setTitle("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setThumbnail(null);
      setThumbnailPreview("");
      setIsLoading(false);
      onClose();
    } catch (err) {
      setError("Failed to create election.");
      console.error('Upload failed:', err);
      setIsLoading(false);
    }
  };

  return (
    <section className={classes.modalOverlay} role="dialog" aria-modal="true">
      <div className={classes.modalContent}>
        <header className={classes.modalHeader}>
          <div className={classes.modalTitleGroup}>
            <h4>Create New Election</h4>
            <p className={classes.modalSubheading}>
              Define the schedule and upload a visual that represents the election.
            </p>
          </div>
          <button className={classes.modalCloseButton} onClick={onClose} aria-label="Close modal" disabled={isLoading} type="button">
            <IoMdClose />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={classes.modalForm}>
          {error && (
            <p className={classes.formError} role="alert">
              {error}
            </p>
          )}
          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="create-election-title">Election Title</label>
            <input
              id="create-election-title"
              type='text'
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Student Council Election"
            />
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="create-election-description">Description</label>
            <textarea
              id="create-election-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Share key details, eligibility, and what voters should know."
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.formField}>
              <label className={classes.formLabel} htmlFor="create-election-start">Start Date & Time</label>
              <input
                id="create-election-start"
                type='datetime-local'
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          
            <div className={classes.formField}>
              <label className={classes.formLabel} htmlFor="create-election-end">End Date & Time</label>
              <input
                id="create-election-end"
                type='datetime-local'
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="create-election-thumbnail">Thumbnail</label>
            <div className={`${classes.fileUpload} ${isLoading ? classes.fileUploadDisabled : ''}`}>
              <input
                id="create-election-thumbnail"
                type='file'
                accept="image/*"
                required
                onChange={handleThumbnailChange}
                disabled={isLoading}
              />
              <span className={classes.fileUploadTitle}>Click to upload image</span>
              <span className={classes.fileUploadMeta}>
                {thumbnail ? `Selected: ${thumbnail.name}` : "PNG, JPG, or WebP. Recommended 1200x800."}
              </span>
            </div>
            {thumbnailPreview && (
              <div className={classes.preview}>
                <span className={classes.previewLabel}>Preview</span>
                <img src={thumbnailPreview} alt="Election thumbnail preview" />
              </div>
            )}
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
