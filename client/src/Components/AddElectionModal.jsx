import React, { useEffect, useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { createElection } from '../utils/apiSimulator';
import classes from './AddElectionModal.module.css'; // Import CSS module

const AddElectionModal = ({ onClose = () => {}, onElectionAdded = () => {} }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [thumbnail, setThumbnail] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
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

  useEffect(() => {
    if (!thumbnail) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(thumbnail);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

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
      title: title.trim(),
      description: description.trim(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      thumbnail,
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
        setPreviewUrl('');
        onClose();
      } else {
        setError(response.message || "Failed to create election.");
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
          {error && <p className={classes.formError}>{error}</p>}
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="election-title">
              Election title
            </label>
            <input
              id="election-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className={classes.fieldControl}
              placeholder="e.g. 2026 Student Council Election"
            />
            <span className={classes.fieldHint}>This appears on the public election card.</span>
          </div>

          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="election-description">
              Description
            </label>
            <textarea
              id="election-description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
              className={`${classes.fieldControl} ${classes.fieldTextarea}`}
              placeholder="Share the purpose and scope of this election."
            />
          </div>

          <div className={classes.fieldGroup}>
            <span className={classes.fieldLabel}>Schedule</span>
            <div className={classes.timeGrid}>
              <label className={classes.timeCard} htmlFor="election-start">
                <span className={classes.timeBadge}>Start</span>
                <input
                  id="election-start"
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isLoading}
                  className={classes.timeInput}
                />
                <span className={classes.timeHint}>Local time</span>
              </label>

              <label className={classes.timeCard} htmlFor="election-end">
                <span className={classes.timeBadge}>End</span>
                <input
                  id="election-end"
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
            <label className={classes.fileDrop} htmlFor="election-thumbnail">
              <input
                id="election-thumbnail"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/avif"
                required
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                disabled={isLoading}
                className={classes.fileInput}
              />
              <div className={classes.fileDropContent}>
                <span className={classes.fileDropTitle}>Upload election artwork</span>
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
            {previewUrl && (
              <div className={classes.preview}>
                <img
                  className={classes.previewImage}
                  src={previewUrl}
                  alt="Election preview"
                />
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
