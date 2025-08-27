import React from 'react'
import {elections} from '../Data'
import { candidates } from '../Data'
import { useParams } from 'react-router-dom'

const ElectionDetials = () => {

  const {id} = useParams();

  const electionCandidates = candidates.filter(candidate => candidate.election);


  const currentElection = elections.find(election => election.id === id);
  return (
    <section className='electionDetails'>
      <div className='container electionDetails_container'>
        <h2>{currentElection.title}</h2>
        <p>{currentElection.description}</p>
        <p><strong>Date:</strong> {currentElection.date}</p>
        <p><strong>Time:</strong> {currentElection.time}</p>
        <div className='electionDetails_image'>
          <img src={currentElection.thumbnail} alt={currentElection.title} />
        </div>
      </div>
    </section>
  )
}

export default ElectionDetials