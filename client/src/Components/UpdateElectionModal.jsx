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

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number') return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

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
      setStartDate(formatToDateTimeLocal(electionData.startTime || electionData.startDate));
      setEndDate(formatToDateTimeLocal(electionData.endTime || electionData.endDate));
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
      title: title.trim(),
      description: description.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      ...(thumbnail && { thumbnail }),
    };

    try {
      const response = await updateElection(updatedData);
      if (response.success) {
        onElectionUpdated(response.data);
        onClose();
      } else {
        setError(response.message || "Failed to update election.");
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
          {error && <p className={classes.formError}>{error}</p>}
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="edit-election-title">
              Election title
            </label>
            <input
              id="edit-election-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className={classes.fieldControl}
              placeholder="Update the election title"
            />
          </div>

          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="edit-election-description">
              Description
            </label>
            <textarea
              id="edit-election-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className={`${classes.fieldControl} ${classes.fieldTextarea}`}
              placeholder="Update the election description"
            />
          </div>

          <div className={classes.fieldGroup}>
            <span className={classes.fieldLabel}>Schedule</span>
            <div className={classes.timeGrid}>
              <label className={classes.timeCard} htmlFor="edit-election-start">
                <span className={classes.timeBadge}>Start</span>
                <input
                  id="edit-election-start"
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  className={classes.timeInput}
                />
                <span className={classes.timeHint}>Local time</span>
              </label>

              <label className={classes.timeCard} htmlFor="edit-election-end">
                <span className={classes.timeBadge}>End</span>
                <input
                  id="edit-election-end"
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isLoading}
                  className={classes.timeInput}
                />
                <span className={classes.timeHint}>Local time</span>
              </label>
            </div>
          </div>

          <div className={classes.fieldGroup}>
            <span className={classes.fieldLabel}>Thumbnail</span>
            <label className={classes.fileDrop} htmlFor="edit-election-thumbnail">
              <input
                id="edit-election-thumbnail"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                disabled={isLoading}
                className={classes.fileInput}
              />
              <div className={classes.fileDropContent}>
                <span className={classes.fileDropTitle}>Replace election artwork</span>
                <span className={classes.fileDropHint}>
                  PNG, JPG, WEBP, or AVIF up to 5MB.
                </span>
              </div>
              <div className={classes.fileMeta}>
                {thumbnail
                  ? `${thumbnail.name} (${formatFileSize(thumbnail.size)})`
                  : 'No file selected'}
              </div>
            </label>
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
