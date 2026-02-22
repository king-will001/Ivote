import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import ResultElection from '../Components/ResultElection'
import { fetchResults } from '../utils/apiSimulator'

const Results = () => {
  const user = useSelector((state) => state.auth?.user)
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const electionsRef = useRef([])

  useEffect(() => {
    electionsRef.current = elections
  }, [elections])

  useEffect(() => {
    let isActive = true
    const pollMs = user?.isAdmin ? 10000 : 20000
    const getResults = async (showLoader = false) => {
      try {
        if (showLoader) {
          setIsLoading(true)
        }
        const response = await fetchResults({
          includeLiveForOpen: Boolean(user?.isAdmin),
          auth: Boolean(user?.isAdmin),
        })
        if (response.success) {
          if (!isActive) return
          setElections(response.data)
          if (showLoader) {
            setError(null)
          }
        } else {
          if (!isActive) return
          if (showLoader) {
            setError(response.message)
          }
        }
      } catch (err) {
        if (!isActive) return
        if (showLoader) {
          setError('Failed to fetch election results.')
        }
      } finally {
        if (!isActive) return
        if (showLoader) {
          setIsLoading(false)
        }
      }
    }

    getResults(true)
    const intervalId = setInterval(() => {
      if (document.hidden) return
      const hasOpen = electionsRef.current.some((election) => !election?.isClosed)
      if (!hasOpen) return
      getResults(false)
    }, pollMs)

    return () => {
      isActive = false
      clearInterval(intervalId)
    }
  }, [user?.isAdmin])

  const resultsStats = useMemo(() => {
    const closedElections = elections.filter((election) => election?.isClosed)
    const totalVotes = elections.reduce(
      (sum, election) => sum + (Number(election?.totalVotes) || 0),
      0
    )
    const totalCandidates = elections.reduce((sum, election) => {
      const count =
        typeof election?.candidateCount === 'number'
          ? election.candidateCount
          : Array.isArray(election?.candidates)
            ? election.candidates.length
            : 0
      return sum + count
    }, 0)
    return {
      totalVotes,
      totalCandidates,
      totalElections: elections.length,
      closedCount: closedElections.length,
      closedElections,
    }
  }, [elections])

  if (isLoading) {
    return (
      <section className='results'>
        <div className='container'>
          <p>Loading election results...</p>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className='results'>
        <div className='container'>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      </section>
    )
  }

  if (elections.length === 0) {
    return (
      <section className='results'>
        <div className='container results_shell'>
          <div className='results_empty'>
            <p>No election results available yet.</p>
          </div>
        </div>
      </section>
    )
  }

  const noClosedResults = resultsStats.closedCount === 0

  return (
    <section className='results'>
      <div className='container results_shell'>
        <div className='results_hero'>
          <div className='results_hero-copy'>
            <span className='results_kicker'>Election Insights</span>
            <h1>Results Dashboard</h1>
            <p>
              {user?.isAdmin
                ? 'Admins can monitor live progress for active elections. Final results publish at close.'
                : 'Results are published when an election closes. Voting remains live until then.'}
            </p>
          </div>
          <div className='results_stats'>
            <div className='results_stat-card'>
              <span>Total votes (live)</span>
              <strong>{resultsStats.totalVotes}</strong>
              <small>Across all elections</small>
            </div>
            <div className='results_stat-card'>
              <span>Candidate pool</span>
              <strong>{resultsStats.totalCandidates}</strong>
              <small>{resultsStats.totalElections} election{resultsStats.totalElections === 1 ? '' : 's'}</small>
            </div>
          </div>
        </div>

        <div className='results_section'>
          <div className='results_section-header'>
            <div>
              <h2>Election summaries</h2>
              <p>
                {noClosedResults
                  ? 'Results will appear after each election ends.'
                  : 'Open any closed election to review candidate performance.'}
              </p>
            </div>
            <span className='results_section-count'>
              {elections.length} result{elections.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className='results_grid'>
            {elections.map((election) => (
              <ResultElection key={election.id} {...election} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Results
