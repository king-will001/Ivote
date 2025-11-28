import React, { useEffect, useState } from 'react'
import ResultElection from '../Components/ResultElection'
import { fetchResults } from '../utils/apiSimulator'

const Results = () => {
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const getResults = async () => {
      try {
        const response = await fetchResults()
        if (response.success) {
          setElections(response.data)
        } else {
          setError(response.message)
        }
      } catch (err) {
        setError('Failed to fetch election results.')
      } finally {
        setIsLoading(false)
      }
    }
    getResults()
  }, [])

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
        <div className='container'>
          <p>No election results available yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className='results'>
      <div className='container results_container'>
        {elections.map((election) => (
          <ResultElection key={election.id} {...election} />
        ))}
      </div>
    </section>
  )
}

export default Results
