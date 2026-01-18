import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import ResultElection from '../Components/ResultElection'
import { fetchResults } from '../utils/apiSimulator'
import Loader from '../Components/Loader'

const Results = () => {
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const isElectionEnded = (endTime) => {
    if (!endTime) return false
    const end = new Date(endTime)
    if (Number.isNaN(end.getTime())) return false
    return new Date() > end
  }

  const isElectionLive = (startTime, endTime) => {
    if (!startTime || !endTime) return false
    const start = new Date(startTime)
    const end = new Date(endTime)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
    const now = new Date()
    return now >= start && now <= end
  }

  const loadResults = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsLoading(true)
      setError(null)
    }
    try {
      const response = await fetchResults()
      if (response.success) {
        setElections(response.data)
      } else if (!silent) {
        setError(response.message)
      }
    } catch (err) {
      if (!silent) {
        setError('Failed to fetch election results.')
      }
    } finally {
      if (!silent) {
        setIsLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    loadResults()
  }, [loadResults])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      loadResults({ silent: true })
    }, 10000)
    return () => clearInterval(interval)
  }, [loadResults])

  if (isLoading) {
    return (
      <section className='results'>
        <div className='container'>
          <Loader label="Loading election results..." size="lg" fullPage />
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

  const completedResults = elections
    .filter((election) => isElectionEnded(election.endTime))
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
  const liveResults = elections
    .filter((election) => isElectionLive(election.startTime, election.endTime))
    .sort((a, b) => new Date(a.endTime || 0).getTime() - new Date(b.endTime || 0).getTime())
  const upcomingResults = elections
    .filter((election) => !isElectionEnded(election.endTime) && !isElectionLive(election.startTime, election.endTime))
    .sort((a, b) => new Date(a.startTime || 0).getTime() - new Date(b.startTime || 0).getTime())
  const totalVotes = elections.reduce((sum, election) => sum + (election.totalVotes || 0), 0)

  return (
    <section className='results'>
      <div className='container results_shell'>
        <header className='results_hero'>
          <div className='results_hero-copy'>
            <span className='results_kicker'>Election Results</span>
            <h1>Live results update as votes are cast.</h1>
            <p>
              Track live elections in real time, then review final totals once
              polls close.
            </p>
          </div>
          <div className='results_stats'>
            <div className='results_stat-card'>
              <span>Total elections</span>
              <strong>{elections.length}</strong>
              <small>All cycles</small>
            </div>
            <div className='results_stat-card'>
              <span>Live now</span>
              <strong>{liveResults.length}</strong>
              <small>Active elections</small>
            </div>
            <div className='results_stat-card'>
              <span>Upcoming</span>
              <strong>{upcomingResults.length}</strong>
              <small>Not started</small>
            </div>
            <div className='results_stat-card'>
              <span>Total votes</span>
              <strong>{totalVotes}</strong>
              <small>Live + completed</small>
            </div>
          </div>
        </header>

        {liveResults.length > 0 && (
          <section className='results_section'>
            <div className='results_section-header'>
              <div>
                <h2>Live results</h2>
                <p>Vote counts update automatically while polls are open.</p>
              </div>
              <span className='results_section-count'>
                {liveResults.length} live
              </span>
            </div>
            <div className='results_grid'>
              {liveResults.map((election) => (
                <ResultElection key={election.id} {...election} status="live" showCandidates />
              ))}
            </div>
          </section>
        )}

        <section className='results_section'>
          <div className='results_section-header'>
            <div>
              <h2>Finalized results</h2>
              <p>Only elections that have ended are shown here.</p>
            </div>
            <span className='results_section-count'>
              {completedResults.length} {completedResults.length === 1 ? 'result' : 'results'}
            </span>
          </div>

          {completedResults.length === 0 ? (
            <div className='results_empty'>
              <h3>No results yet</h3>
              <p>Results will appear automatically once an election closes.</p>
              <Link to='/elections' className='btn primary'>Browse Elections</Link>
            </div>
          ) : (
            <div className='results_grid'>
              {completedResults.map((election) => (
                <ResultElection key={election.id} {...election} status="final" showCandidates />
              ))}
            </div>
          )}
        </section>

        {upcomingResults.length > 0 && (
          <section className='results_section'>
            <div className='results_section-header'>
              <div>
                <h2>Upcoming elections</h2>
                <p>These elections have not started yet.</p>
              </div>
              <span className='results_section-count'>
                {upcomingResults.length} upcoming
              </span>
            </div>
            <div className='results_grid'>
              {upcomingResults.map((election) => (
                <ResultElection key={election.id} {...election} status="pending" showCandidates={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </section>
  )
}

export default Results
