import React, { useState, useEffect } from 'react'
import { IoMdClose } from 'react-icons/io'
import classes from './AddElectionModal.module.css'

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  try {
    const stored = JSON.parse(localStorage.getItem('user'))
    return stored?.token || null
  } catch (error) {
    return null
  }
}

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(new Error("Failed to read file"))
  reader.readAsDataURL(file)
})

const AddCandidateModal = ({ elections = [], onClose = () => {}, onAddCandidate = () => {} }) => {
  const initialElectionId = elections.length ? String(elections[0].id) : ''
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [motto, setMotto] = useState('')
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [electionId, setElectionId] = useState(initialElectionId)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setElectionId(initialElectionId)
  }, [initialElectionId])

  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0] || null
    setPhoto(file)
    setError(null)

    if (!file) {
      setPhotoPreview('')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setPhotoPreview(typeof dataUrl === 'string' ? dataUrl : '')
    } catch (err) {
      setPhotoPreview('')
      setError('Failed to read the selected image.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    console.log('Form submitted');
    console.log('Elections:', elections);
    console.log('Election ID:', electionId);
    console.log('First Name:', firstName);
    console.log('Last Name:', lastName);
    console.log('Motto:', motto);
    console.log('Photo:', photo);
    
    if (!photo) {
      setError("Please select a candidate photo");
      setIsLoading(false);
      return;
    }
    
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('motto', motto);
    formData.append('image', photo); // File input

    const requestUrl = `${API_BASE_URL}/api/elections/${electionId}/candidates`
    console.log('Sending request to:', requestUrl);
    
    try {
      const token = getStoredToken()
      console.log('Token from user object:', !!token);

      if (!token) {
        setError("Please sign in as an admin to add candidates.")
        setIsLoading(false)
        return
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Response status:', response.status);
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Server error:', data);
        setError(data.message || `Error: ${response.status}`);
        setIsLoading(false);
        return;
      }
      
      console.log('Success response:', data);
      console.log('Candidate data:', data.candidate);
      
      onAddCandidate(data.candidate);
      setFirstName('');
      setLastName('');
      setMotto('');
      setPhoto(null);
      setPhotoPreview('');
      setElectionId(initialElectionId);
      setIsLoading(false);
      onClose();
    } catch (error) {
      setError("Failed to add candidate.");
      console.error('Upload failed:', error);
      setIsLoading(false);
    }
  }

  const electionName = elections.find((item) => String(item.id) === String(electionId))?.title || 'Selected election'

  return (
    <section className={classes.modalOverlay} role='dialog' aria-modal='true'>
      <div className={classes.modalContent}>
        <header className={classes.modalHeader}>
          <div className={classes.modalTitleGroup}>
            <h4>Add New Candidate</h4>
            <p className={classes.modalSubheading}>
              Enter candidate details and upload a profile image for voters.
            </p>
          </div>
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
          {error && (
            <p className={classes.formError} role="alert">
              {error}
            </p>
          )}

          <div className={classes.formRow}>
            <div className={classes.formField}>
              <label className={classes.formLabel} htmlFor="candidate-first-name">First name</label>
              <input
                id="candidate-first-name"
                type='text'
                value={firstName}
                name='firstName'
                onChange={e => setFirstName(e.target.value)}
                required
                disabled={isLoading}
                placeholder="e.g. Ndambo"
              />
            </div>
            <div className={classes.formField}>
              <label className={classes.formLabel} htmlFor="candidate-last-name">Last name</label>
              <input
                id="candidate-last-name"
                type='text'
                value={lastName}
                name='lastName'
                onChange={e => setLastName(e.target.value)}
                required
                disabled={isLoading}
                placeholder="e.g. Boseh"
              />
            </div>
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="candidate-motto">Candidate motto</label>
            <input
              id="candidate-motto"
              type='text'
              value={motto}
              name='motto'
              onChange={e => setMotto(e.target.value)}
              disabled={isLoading}
              placeholder="Share a short vision or mission"
              required
            />
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="candidate-election">Election</label>
            <input
              id="candidate-election"
              type="text"
              value={electionName}
              disabled
            />
          </div>

          <div className={classes.formField}>
            <label className={classes.formLabel} htmlFor="candidate-photo">Candidate photo</label>
            <div className={`${classes.fileUpload} ${isLoading ? classes.fileUploadDisabled : ''}`}>
              <input
                id="candidate-photo"
                type='file'
                name='photo'
                accept='image/png,image/jpg,image/jpeg,image/webp,image/svg+xml,image/avif'
                onChange={handlePhotoChange}
                required
                disabled={isLoading}
              />
              <span className={classes.fileUploadTitle}>Click to upload image</span>
              <span className={classes.fileUploadMeta}>
                {photo ? `Selected: ${photo.name}` : "PNG, JPG, or WebP. Recommended 800x800."}
              </span>
            </div>

            {photoPreview && (
              <div className={classes.preview}>
                <span className={classes.previewLabel}>Preview</span>
                <img src={photoPreview} alt="Candidate preview" />
              </div>
            )}
          </div>

          <footer className={classes.modalFooter}>
            <button type='button' className='btn' onClick={onClose} disabled={isLoading}>Cancel</button>
            <button type='submit' className='btn primary' disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add Candidate'}
            </button>
          </footer>
        </form>
      </div>
    </section>
  )
}

export default AddCandidateModal
