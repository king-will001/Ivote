import React, { useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { createCandidate } from '../utils/apiSimulator' // Import the simulated API call

const AddCandidateModal = ({ elections = [], onClose = () => {}, onAddCandidate = () => {} }) => {
  const [fullName, setFullName] = useState('')
  const [motto, setMotto] = useState('')
  const [photo, setPhoto] = useState(null)
  const [electionId, setElectionId] = useState(elections.length ? String(elections[0].id) : '')
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null);
    setIsLoading(true);

    if (!fullName.trim() || !electionId) {
      setError("Full name and election are required.");
      setIsLoading(false);
      return;
    }

    const newCandidate = {
      fullName: fullName.trim(),
      motto: motto.trim(),
      election: electionId,
      image: photo ? URL.createObjectURL(photo) : null, // Simulate image URL
    };

    try {
      const response = await createCandidate(newCandidate);
      if (response.success) {
        onAddCandidate(response.data);
        // reset & close
        setFullName('');
        setMotto('');
        setPhoto(null);
        setElectionId(elections.length ? String(elections[0].id) : '');
        onClose();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Failed to add candidate.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className='modal' role='dialog' aria-modal='true'>
      <div className='modal_content'>
        <header className='modal_header'>
          <h2>Add New Candidate</h2>
          <button
            type='button'
            className='close_modal-btn'
            aria-label='Close'
            onClick={onClose}
            disabled={isLoading}
          >
            <IoMdClose />
          </button>
        </header>

        <form onSubmit={handleSubmit}>
          {error && <p style={{color: 'red', marginBottom: '1rem'}}>{error}</p>}
          <div>
            <label>
              <h6>Candidate Name:</h6>
              <input
                type='text'
                value={fullName}
                name='fullName'
                onChange={e => setFullName(e.target.value)}
                required
                disabled={isLoading}
              />
            </label>
          </div>

          <div>
            <label>
              <h6>Candidate Motto:</h6>
              <input
                type='text'
                value={motto}
                name='motto'
                onChange={e => setMotto(e.target.value)}
                disabled={isLoading}
              />
            </label>
          </div>

          <div>
            <label>
              <h6>Candidate Photo:</h6>
              <input
                type='file'
                name='photo'
                accept='image/png,image/jpg,image/jpeg,image/webp,image/svg+xml,image/avif'
                onChange={e => setPhoto(e.target.files?.[0] || null)}
                required
                disabled={isLoading}
              />
            </label>
          </div>

          {/* The election selection is removed as ElectionDetails passes only one election */}
          <input type="hidden" value={electionId} name="election" />

          <footer style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
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
