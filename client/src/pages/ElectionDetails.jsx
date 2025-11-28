import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { elections, candidates, voters } from '../Data'
import { useParams } from 'react-router-dom'
import ElectionCandidate from '../Components/ElectionCandidate'
import { IoAddOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { uiActions } from '../store/uiSlice'
import AddCandidateModal from '../Components/AddCandidateModal'

// ConfirmVote modal component (centered)
const ConfirmVote = ({ candidate, onClose, onConfirm }) => {
  if (!candidate) return null
  const node = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.18)',
        zIndex: 2000,
        padding: 20,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div style={{ width: 420, maxWidth: '100%', background: '#fff', borderRadius: 16, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', textAlign: 'center' }}>
        <h2 style={{ color: '#2563eb', fontWeight: 700, marginBottom: 8 }}>PLEASE CONFIRM YOUR VOTE</h2>
        <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>ARE YOU SURE YOU WANT TO VOTE FOR <span style={{ color: '#2563eb' }}>{candidate.fullName?.toUpperCase()}</span>?</h3>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <img src={candidate.image} alt={candidate.fullName} style={{ width: 260, height: 220, objectFit: 'cover', borderRadius: 12 }} />
        </div>
        <p style={{ color: '#333', marginBottom: 18 }}>{candidate.motto}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
          <button onClick={onClose} style={{ border: '1px solid #111', background: '#fff', padding: '10px 24px', borderRadius: 8 }}>Cancel</button>
          <button onClick={() => onConfirm(candidate.id)} style={{ background: '#2563eb', color: '#fff', padding: '10px 24px', borderRadius: 8, border: 'none' }}>Confirm Vote</button>
        </div>
      </div>
    </div>
  )
  return createPortal(node, document.body)
}

const ElectionDetails = () => {
  const sectionRef = useRef(null)
  const { id } = useParams()
  const dispatch = useDispatch()
  const [showVoteConfirm, setShowVoteConfirm] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)

  // lock body scroll while modal open
  useEffect(() => {
    if (showVoteConfirm) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = prev }
    }
    return undefined
  }, [showVoteConfirm])

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      if (rect.top < window.innerHeight - 100) {
        sectionRef.current.classList.add('visible')
      } else {
        sectionRef.current.classList.remove('visible')
      }
    }
    // use passive listener for smoother scrolling
    window.addEventListener('scroll', handleScroll, { passive: true })
    // Reveal on mount
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Find current election
  const currentElection = elections.find(
    election => String(election.id) === String(id)
  )

  // Filter candidates for this election
  const electionCandidates = candidates.filter(
    candidate => String(candidate.election) === String(id)
  )

  const addCandidateModalShowing = useSelector(state => state.ui.addCandidateModalShowing)

  if (!currentElection) {
    return <p>Election not found.</p>
  }

// open add candidate modal
  const openModal = () => {
    // dispatch the toolkit action from uiSlice
    dispatch(uiActions.openAddCandidateModal())
  }



  return (
    <>
      <section ref={sectionRef} className='electionDetails reveal-on-scroll'>
      <div className='container electionDetails_container'>
        <h2>{currentElection.title}</h2>
        <p>{currentElection.description}</p>
        <p><strong>Date:</strong> {currentElection.date}</p>
        <p><strong>Time:</strong> {currentElection.time}</p>

        <div className='electionDetails_image'>
          <img src={currentElection.thumbnail} alt={currentElection.title} />
        </div>

        <div className='electionDetails_candidates'>
          <h3>Candidates</h3>
          <ul className="candidates_grid">
            {electionCandidates.map(candidate => (
              <ElectionCandidate
                key={candidate.id}
                {...candidate}
                onDelete={(candidateId) => {
                  // placeholder delete: filter out locally (Data is static here)
                  // In real app dispatch action or call API
                  // eslint-disable-next-line no-console
                  console.log('Delete candidate', candidateId)
                }}
                onVote={(candidateId) => {
                  const c = electionCandidates.find(x => x.id === candidateId)
                  setSelectedCandidate(c || null)
                  setShowVoteConfirm(true)
                }}
              />
            ))}
            <li>
              <button className='add_candidate-btn' onClick={openModal}>
                <IoAddOutline />
              </button>
            </li>
          </ul>
        </div>

        <div className='voters_table_wrapper'>
          <h2>Voters</h2>
          <table className='voters_table'>
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {voters.map((voter, idx) => (
                <tr key={idx}>
                  <td><h5>{voter.fullName}</h5></td>
                  <td>{voter.email}</td>
                  <td>{voter.time ?? "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>

  {addCandidateModalShowing && (
    <AddCandidateModal
      elections={[currentElection]}
      onClose={() => dispatch(uiActions.closeAddCandidateModal())}
      onAddCandidate={(payload) => {
        // TODO: replace this with a real API/store dispatch to save the candidate
        // For now we log and close the modal via the onClose handler above
        // Example: dispatch(candidatesActions.addCandidate(payload))
        // eslint-disable-next-line no-console
        console.log('AddCandidate payload', payload)
      }}
    />
  )}
  {showVoteConfirm && selectedCandidate && (
    <ConfirmVote
      candidate={selectedCandidate}
      onClose={() => { setShowVoteConfirm(false); setSelectedCandidate(null) }}
      onConfirm={(candidateId) => {
        // TODO: integrate real vote logic (call API, update UI)
        // For now just close modal and log
        // eslint-disable-next-line no-console
        console.log('Confirmed vote for', candidateId)
        setShowVoteConfirm(false)
        setSelectedCandidate(null)
      }}
    />
  )}
    </>
  )
}

export default ElectionDetails
