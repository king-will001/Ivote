import React, { useEffect, useRef } from 'react'
import { elections, candidates, voters } from '../Data'
import { useParams } from 'react-router-dom'
import ElectionCandidate from '../Components/ElectionCandidate'
import { IoAddOutline } from 'react-icons/io5'

const ElectionDetails = () => {
  const sectionRef = useRef(null)
  const { id } = useParams()

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
    window.addEventListener('scroll', handleScroll)
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

  if (!currentElection) {
    return <p>Election not found.</p>
  }

  return (
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
              <ElectionCandidate key={candidate.id} {...candidate} />
            ))}
            <li>
              <button className='add_candidate-btn'>
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
  )
}

export default ElectionDetails
