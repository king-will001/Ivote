import React, { useState, useEffect } from 'react';
import { IoMdClose } from 'react-icons/io';
import { updateElection } from '../utils/apiSimulator';
import classes from './AddElectionModal.module.css'; // Reuse styles from AddElectionModal

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Failed to read file"));
  reader.readAsDataURL(file);
});

const UpdateElectionModal = ({ onClose, onElectionUpdated, electionData }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [currentThumbnail, setCurrentThumbnail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to format ISO date string to datetime-local input format
  const formatToDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    const offsetMs = date.getTimezoneOffset() * 60 * 1000;
    const localDate = new Date(date.getTime() - offsetMs);
    return localDate.toISOString().slice(0, 16);
  };

  // Prefill form when electionData is available
  useEffect(() => {
    if (electionData) {
      setTitle(electionData.title || "");
      setDescription(electionData.description || "");
      setStartTime(formatToDateTimeLocal(electionData.startTime || electionData.startDate));
      setEndTime(formatToDateTimeLocal(electionData.endTime || electionData.endDate));
      setCurrentThumbnail(electionData.thumbnail || "");
      setThumbnailPreview("");
      setThumbnail(null);
    }
  }, [electionData]);

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

    if (!title.trim() || !description.trim() || !startTime || !endTime) {
      setError("All fields except thumbnail are required.");
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

    const updatedData = {
      id: electionData.id,
      title,
      description,
      date: startTime.split('T')[0],
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      // Only include thumbnail if a new one was selected
      ...(thumbnailPreview && { thumbnail: thumbnailPreview }),
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
          <div className={classes.modalTitleGroup}>
            <h4>Update Election</h4>
            <p className={classes.modalSubheading}>
              Refresh schedule details or change the election cover image.
            </p>
          </div>
          <button className={classes.modalCloseButton} onClick={onClose} aria-label="Close modal" disabled={isLoading}>
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
            <label className={classes.formLabel} htmlFor="update-election-title">Election Title</label>
            <input
              id="update-election-title"
              type='text'
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Student Council Election"
            />
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="update-election-description">Description</label>
            <textarea
              id="update-election-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              placeholder="Share key details, eligibility, and what voters should know."
            />
          </div>

          <div className={classes.formRow}>
            <div className={classes.formField}>
              <label className={classes.formLabel} htmlFor="update-election-start">Start Date & Time</label>
              <input
                id="update-election-start"
                type='datetime-local'
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className={classes.formField}>
              <label className={classes.formLabel} htmlFor="update-election-end">End Date & Time</label>
              <input
                id="update-election-end"
                type='datetime-local'
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="update-election-thumbnail">Thumbnail (leave empty to keep current)</label>
            <div className={`${classes.fileUpload} ${isLoading ? classes.fileUploadDisabled : ''}`}>
              <input
                id="update-election-thumbnail"
                type='file'
                accept="image/*"
                onChange={handleThumbnailChange}
                disabled={isLoading}
              />
              <span className={classes.fileUploadTitle}>Click to upload image</span>
              <span className={classes.fileUploadMeta}>
                {thumbnail ? `Selected: ${thumbnail.name}` : "PNG, JPG, or WebP. Current image stays if left empty."}
              </span>
            </div>
            {(thumbnailPreview || currentThumbnail) && (
              <div className={classes.preview}>
                <span className={classes.previewLabel}>
                  {thumbnailPreview ? "New preview" : "Current image"}
                </span>
                <img src={thumbnailPreview || currentThumbnail} alt="Election thumbnail preview" />
              </div>
            )}
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
