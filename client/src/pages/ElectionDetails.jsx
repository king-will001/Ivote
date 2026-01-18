import React, { useEffect, useRef, useState, useContext, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ElectionCandidate from '../Components/ElectionCandidate'
import { IoAddOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux'
import { uiActions } from '../store/uiSlice'
import AddCandidateModal from '../Components/AddCandidateModal'
import { UserContext } from '../context/userContext'
import { fetchElectionById, fetchVoters } from '../utils/apiSimulator'
import ConfirmVote from '../Components/ConfirmVote'
import Loader from '../Components/Loader'

const formatDateTime = (value) => {
  if (!value) return "TBD";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleString();
};

const LIVE_POLL_INTERVAL_MS = 8000;

const getVotingStatus = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { label: "Voting schedule not set", canVote: true };
  }
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { label: "Voting schedule not set", canVote: true };
  }
  const now = new Date();
  if (now < start) {
    return { label: "Voting has not started yet", canVote: false };
  }
  if (now > end) {
    return { label: "Voting has ended", canVote: false };
  }
  return { label: "Voting is open", canVote: true };
};

const ElectionDetails = () => {
  const sectionRef = useRef(null)
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { currentUser } = useContext(UserContext)
  const isAdmin = currentUser?.isAdmin || currentUser?.voter?.isAdmin
  const [showVoteConfirm, setShowVoteConfirm] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState(null)
  const [currentElection, setCurrentElection] = useState(null)
  const [electionCandidates, setElectionCandidates] = useState([])
  const [electionVoters, setElectionVoters] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

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

  // Refetch election data (used after mutations and live polling)
  const refetchElectionData = useCallback(async ({ silent = false } = {}) => {
    try {
      const electionPromise = fetchElectionById(id)
      const votersPromise = isAdmin
        ? fetchVoters(id)
        : Promise.resolve({ success: true, data: [] })
      const [electionResponse, votersResponse] = await Promise.all([
        electionPromise,
        votersPromise,
      ])
      if (!electionResponse.success) {
        if (!silent) {
          setError(electionResponse.message || "Failed to refetch election.")
        }
        return
      }

      const electionData = electionResponse.data
      setCurrentElection(electionData)
      setElectionCandidates(Array.isArray(electionData?.candidates) ? electionData.candidates : [])

      if (isAdmin) {
        setElectionVoters(
          votersResponse.success ? (Array.isArray(votersResponse.data) ? votersResponse.data : []) : []
        )
      } else {
        setElectionVoters([])
      }
    } catch (err) {
      if (!silent) {
        setError("Failed to refetch election data.")
      }
    }
  }, [id, isAdmin])

  useEffect(() => {
    let isActive = true

    const loadElection = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const electionPromise = fetchElectionById(id)
        const votersPromise = isAdmin
          ? fetchVoters(id)
          : Promise.resolve({ success: true, data: [] })
        const [electionResponse, votersResponse] = await Promise.all([
          electionPromise,
          votersPromise,
        ])
        if (!isActive) return

        if (!electionResponse.success) {
          setCurrentElection(null)
          setElectionCandidates([])
          setElectionVoters([])
          setError(electionResponse.message || "Election not found.")
          return
        }

        const electionData = electionResponse.data
        setCurrentElection(electionData)
        setElectionCandidates(Array.isArray(electionData?.candidates) ? electionData.candidates : [])

        if (isAdmin) {
          if (!isActive) return
          setElectionVoters(
            votersResponse.success ? (Array.isArray(votersResponse.data) ? votersResponse.data : []) : []
          )
        } else {
          setElectionVoters([])
        }
      } catch (err) {
        if (!isActive) return
        setError("Failed to fetch election.")
      } finally {
        if (!isActive) return
        setIsLoading(false)
      }
    }

    loadElection()
    return () => { isActive = false }
  }, [id, isAdmin])

  useEffect(() => {
    if (!id) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      refetchElectionData({ silent: true })
    }, LIVE_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [id, refetchElectionData])

  const addCandidateModalShowing = useSelector(state => state.ui.addCandidateModalShowing)

  if (isLoading) {
    return (
      <section className="electionDetails">
        <div className="container">
          <Loader label="Loading election..." size="lg" fullPage />
        </div>
      </section>
    )
  }

  if (error) {
    return <section className="electionDetails"><div className="container" style={{color: 'red'}}>Error: {error}</div></section>
  }

  if (!currentElection) {
    return <p>Election not found.</p>
  }

  const votingStatus = getVotingStatus(
    currentElection.startTime,
    currentElection.endTime
  );
  const totalVotesFromCandidates = electionCandidates.reduce((sum, candidate) => {
    const count = Number(candidate?.voteCount ?? 0)
    return Number.isFinite(count) ? sum + count : sum
  }, 0)
  const totalVotes = isAdmin ? electionVoters.length : totalVotesFromCandidates

// open add candidate modal
  const openModal = () => {
    // dispatch the toolkit action from uiSlice
    dispatch(uiActions.openAddCandidateModal())
  }



  const handleDeleteCandidate = (candidateId) => {
    // placeholder delete: filter out locally (Data is static here)
    // In real app dispatch action or call API
    // eslint-disable-next-line no-console
    console.log('Delete candidate', candidateId)
  }

  return (
    <>
      <section ref={sectionRef} className='electionDetails reveal-on-scroll'>
      <div className='container electionDetails_container'>
        <h2>{currentElection.title}</h2>
        <p>{currentElection.description}</p>
        <p><strong>Starts:</strong> {formatDateTime(currentElection.startTime)}</p>
        <p><strong>Ends:</strong> {formatDateTime(currentElection.endTime)}</p>
        <p><strong>Status:</strong> {votingStatus.label}</p>

        <div className='electionDetails_stats'>
          <div className='electionDetails_stat'>
            <span>Total votes</span>
            <strong>{totalVotes}</strong>
          </div>
          <div className='electionDetails_stat'>
            <span>Candidates</span>
            <strong>{electionCandidates.length}</strong>
          </div>
          {isAdmin && (
            <div className='electionDetails_stat'>
              <span>Voters</span>
              <strong>{electionVoters.length}</strong>
            </div>
          )}
        </div>

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
                canVote={votingStatus.canVote}
                onDelete={isAdmin ? handleDeleteCandidate : undefined}
                onVote={(candidateId) => {
                  if (!votingStatus.canVote) {
                    return;
                  }
                  setSelectedCandidateId(candidateId)
                  setShowVoteConfirm(true)
                }}
              />
            ))}
            {isAdmin && (
              <li className="add_candidate-item">
                <button className='add_candidate-btn' onClick={openModal}>
                  <IoAddOutline />
                </button>
              </li>
            )}
          </ul>
        </div>

        <div className='voters_table_wrapper'>
          <h2>Voters</h2>
          {isAdmin ? (
            <table className='voters_table'>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {electionVoters.length === 0 && (
                  <tr>
                    <td colSpan={3}>No voters yet.</td>
                  </tr>
                )}
                {electionVoters.map((voter, idx) => {
                  const fullName =
                    voter?.fullName ||
                    `${voter?.firstName || ""} ${voter?.lastName || ""}`.trim() ||
                    "Unknown"
                  return (
                    <tr key={voter?.id || voter?._id || idx}>
                      <td><h5>{fullName}</h5></td>
                    <td>{voter?.email || "N/A"}</td>
                    <td>{voter?.time ? formatDateTime(voter.time) : "N/A"}</td>
                  </tr>
                )
              })}
              </tbody>
            </table>
          ) : (
            <p className='voters_table_notice'>Only admins can view the voter list.</p>
          )}
        </div>
      </div>
    </section>

  {isAdmin && addCandidateModalShowing && (
    <AddCandidateModal
      elections={[currentElection]}
      onClose={() => dispatch(uiActions.closeAddCandidateModal())}
      onAddCandidate={(payload) => {
        if (!payload) {
          return
        }
        // Refetch election data to ensure we have the latest candidate list
        refetchElectionData()
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
        // Refetch election data after vote to update vote counts and voters list
        refetchElectionData()
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
