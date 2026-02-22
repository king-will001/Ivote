import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { IoAddOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { uiActions } from '../store/uiSlice'
import AddCandidateModal from '../Components/AddCandidateModal'
import ElectionCandidate from '../Components/ElectionCandidate'
import ConfirmVote from '../Components/ConfirmVote'
import { deleteCandidate, fetchElectionById, fetchVoters } from '../utils/apiSimulator'

const ElectionDetails = () => {
  const sectionRef = useRef(null)
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [election, setElection] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [voters, setVoters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [votersError, setVotersError] = useState(null)
  const [candidateActionError, setCandidateActionError] = useState(null)
  const [deletingCandidateId, setDeletingCandidateId] = useState(null)
  const [showVoteConfirm, setShowVoteConfirm] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)

  const addCandidateModalShowing = useSelector(state => state.ui.addCandidateModalShowing)
  const user = useSelector(state => state.auth?.user)

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
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const loadElection = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetchElectionById(id)
      if (response.success) {
        setElection(response.data)
        setCandidates(response.data?.candidates || [])
      } else {
        setError(response.message || 'Failed to load election.')
      }
    } catch (err) {
      setError('Failed to load election.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  const loadVoters = useCallback(async () => {
    setVotersError(null)
    if (!user?.isAdmin) {
      setVotersError('Admin access required to view voters.')
      return
    }
    try {
      const response = await fetchVoters(id)
      if (response.success) {
        setVoters(response.data)
      } else {
        setVotersError(response.message || 'Unable to load voters.')
      }
    } catch (err) {
      setVotersError('Unable to load voters.')
    }
  }, [id, user?.isAdmin])

  const handleDeleteCandidate = async (candidateId) => {
    if (!user?.isAdmin) return
    const candidate = candidates.find((item) => item.id === candidateId)
    const candidateName = candidate?.fullName || 'this candidate'
    const confirmed = window.confirm(
      `Delete ${candidateName}? This will remove their votes and cannot be undone.`
    )
    if (!confirmed) return

    setCandidateActionError(null)
    setDeletingCandidateId(candidateId)
    try {
      const response = await deleteCandidate(id, candidateId)
      if (response.success) {
        setCandidates((prev) => prev.filter((item) => item.id !== candidateId))
        setElection((prev) =>
          prev
            ? { ...prev, candidates: prev.candidates?.filter((item) => item.id !== candidateId) }
            : prev
        )
        loadVoters()
      } else {
        setCandidateActionError(response.message || 'Unable to delete candidate.')
      }
    } catch (err) {
      setCandidateActionError('Unable to delete candidate.')
    } finally {
      setDeletingCandidateId(null)
    }
  }

  useEffect(() => {
    loadElection()
    loadVoters()
  }, [loadElection, loadVoters])

  const openModal = () => {
    dispatch(uiActions.openAddCandidateModal())
  }

  const formatDateLabel = (value) => {
    if (!value) return 'TBD'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'TBD'
    return date.toLocaleString()
  }

  const startLabel = formatDateLabel(election?.startTime)
  const endLabel = formatDateLabel(election?.endTime)

  if (isLoading) {
    return (
      <section className='electionDetails'>
        <div className='container electionDetails_container'>Loading election...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='electionDetails'>
        <div className='container electionDetails_container' style={{ color: 'red' }}>
          {error}
        </div>
      </section>
    )
  }

  if (!election) {
    return (
      <section className='electionDetails'>
        <div className='container electionDetails_container'>Election not found.</div>
      </section>
    )
  }

  return (
    <>
      <section ref={sectionRef} className='electionDetails reveal-on-scroll'>
        <div className='container electionDetails_container'>
          <div className='electionDetails_header'>
            <div className='electionDetails_summary'>
              <span className='electionDetails_kicker'>Election profile</span>
              <h2>{election.title}</h2>
              <p className='electionDetails_description'>{election.description}</p>
              <div className='electionDetails_stats'>
                <div className='electionDetails_stat'>
                  <span>Starts</span>
                  <strong>{startLabel}</strong>
                </div>
                <div className='electionDetails_stat'>
                  <span>Ends</span>
                  <strong>{endLabel}</strong>
                </div>
                <div className='electionDetails_stat'>
                  <span>Candidates</span>
                  <strong>{candidates.length}</strong>
                </div>
              </div>
            </div>
            <div className='electionDetails_image'>
              <img src={election.thumbnail} alt={election.title} />
            </div>
          </div>

          <div className='electionDetails_candidates'>
            <h3>Candidates</h3>
            {candidateActionError && (
              <p className='form_error-message'>{candidateActionError}</p>
            )}
            <ul className='candidates_grid'>
              {candidates.map(candidate => (
                <ElectionCandidate
                  key={candidate.id}
                  {...candidate}
                  onVote={(candidateId) => {
                    setSelectedCandidateId(candidateId)
                    setShowVoteConfirm(true)
                  }}
                  onDelete={user?.isAdmin ? handleDeleteCandidate : undefined}
                  isDeleting={deletingCandidateId === candidate.id}
                />
              ))}
              {user?.isAdmin && (
                <li className='add_candidate-item'>
                  <button
                    className='add_candidate-btn'
                    onClick={openModal}
                    aria-label='Add candidate'
                    type='button'
                  >
                    <IoAddOutline />
                    <span>Add candidate</span>
                  </button>
                </li>
              )}
            </ul>
          </div>

          <div className='voters_table_wrapper'>
            <h3>Voters</h3>
            {votersError ? (
              <p className='voters_table_notice'>{votersError}</p>
            ) : (
              <table className='voters_table'>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.id}>
                      <td data-label='Full name'><h5>{voter.fullName}</h5></td>
                      <td data-label='Email address'>{voter.email}</td>
                      <td data-label='Time'>{voter.time ? new Date(voter.time).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {user?.isAdmin && addCandidateModalShowing && (
        <AddCandidateModal
          elections={[election]}
          onClose={() => dispatch(uiActions.closeAddCandidateModal())}
          onAddCandidate={(payload) => {
            setCandidates((prev) => [payload, ...prev])
          }}
        />
      )}

      {showVoteConfirm && selectedCandidateId && (
        <ConfirmVote
          electionId={id}
          candidateId={selectedCandidateId}
          onCancel={() => {
            setShowVoteConfirm(false)
            setSelectedCandidateId(null)
          }}
          onConfirm={() => {
            setShowVoteConfirm(false)
            setSelectedCandidateId(null)
            navigate('/congrates')
          }}
        />
      )}
    </>
  )
}

export default ElectionDetails
