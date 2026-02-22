import React, { useState, useEffect } from 'react'
import { IoMdClose } from 'react-icons/io'
import { createCandidate } from '../utils/apiSimulator'
import classes from './AddElectionModal.module.css'

const AddCandidateModal = ({ elections = [], onClose = () => {}, onAddCandidate = () => {} }) => {
  const [fullName, setFullName] = useState('')
  const [motto, setMotto] = useState('')
  const [photo, setPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [electionId, setElectionId] = useState(elections.length ? String(elections[0].id) : '')
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
    if (elections.length) {
      setElectionId(String(elections[0].id));
    }
  }, [elections]);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(photo);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null);
    setIsLoading(true);

    if (!fullName.trim() || !motto.trim() || !electionId) {
      setError("Full name, motto, and election are required.");
      setIsLoading(false);
      return;
    }

    if (!photo) {
      setError("Candidate photo is required.");
      setIsLoading(false);
      return;
    }

    const newCandidate = {
      fullName: fullName.trim(),
      motto: motto.trim(),
      election: electionId,
      photo,
    };

    try {
      const response = await createCandidate(newCandidate);
      if (response.success) {
        onAddCandidate(response.data);
        // reset & close
        setFullName('');
        setMotto('');
        setPhoto(null);
        setPreviewUrl('');
        setElectionId(elections.length ? String(elections[0].id) : '');
        onClose();
      } else {
        setError(response.message || "Failed to add candidate.");
      }
    } catch (err) {
      setError("Failed to add candidate.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={classes.modalOverlay} role='dialog' aria-modal='true'>
      <div className={classes.modalContent}>
        <header className={classes.modalHeader}>
          <h4>Add New Candidate</h4>
          <button
            type='button'
            className={classes.modalCloseButton}
            aria-label='Close'
            onClick={onClose}
            disabled={isLoading}
          >
            <IoMdClose />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={classes.modalForm}>
          {error && <p className={classes.formError}>{error}</p>}
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="candidate-name">
              Candidate name
            </label>
            <input
              id="candidate-name"
              type='text'
              value={fullName}
              name='fullName'
              onChange={e => setFullName(e.target.value)}
              required
              disabled={isLoading}
              className={classes.fieldControl}
              placeholder="e.g. Serge Khan"
            />
          </div>

          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="candidate-motto">
              Candidate motto
            </label>
            <input
              id="candidate-motto"
              type='text'
              value={motto}
              name='motto'
              onChange={e => setMotto(e.target.value)}
              disabled={isLoading}
              className={classes.fieldControl}
              placeholder="Short campaign message"
              required
            />
          </div>

          <div className={classes.fieldGroup}>
            <span className={classes.fieldLabel}>Candidate photo</span>
            <label className={classes.fileDrop} htmlFor="candidate-photo">
              <input
                id="candidate-photo"
                type='file'
                name='photo'
                accept='image/png,image/jpeg,image/webp,image/avif'
                onChange={e => setPhoto(e.target.files?.[0] || null)}
                required
                disabled={isLoading}
                className={classes.fileInput}
              />
              <div className={classes.fileDropContent}>
                <span className={classes.fileDropTitle}>Upload a candidate portrait</span>
                <span className={classes.fileDropHint}>
                  PNG, JPG, WEBP, or AVIF up to 5MB.
                </span>
              </div>
              <div className={classes.fileMeta}>
                {photo ? `${photo.name} (${formatFileSize(photo.size)})` : 'No file selected'}
              </div>
            </label>
            {previewUrl && (
              <div className={classes.preview}>
                <img
                  className={classes.previewImage}
                  src={previewUrl}
                  alt="Candidate preview"
                />
              </div>
            )}
          </div>

          {/* The election selection is removed as ElectionDetails passes only one election */}
          <input type="hidden" value={electionId} name="election" />

          <footer className={classes.modalFooter}>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Candidate'}
            </button>
            <button type='button' className='btn' onClick={onClose} disabled={isLoading}>Cancel</button>
          </footer>
        </form>
      </div>
    </section>
  )
}

export default AddCandidateModal
