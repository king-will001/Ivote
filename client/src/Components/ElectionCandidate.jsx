import React from 'react'
import { IoMdTrash } from 'react-icons/io'

const ElectionCandidate = ({ fullName, image, motto, id, onDelete, onVote }) => {
  return (
    <li className="electionCandidate">
      <div className="electionCandidate_image">
        <img src={image} alt={fullName} />
      </div>
      <div>
        <h5>{fullName}</h5>
        <small>
          {motto?.length > 80 ? motto.slice(0, 80) + "..." : motto}
        </small>
        <p>Candidate ID: {id}</p>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: 8 }}>
          <button className="electionCandidate_btn" onClick={() => onDelete && onDelete(id)} style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <IoMdTrash />
          </button>
          <button onClick={() => onVote && onVote(id)} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 600 }}>
            Vote
          </button>
        </div>
      </div>
    </li>
  )
}

export default ElectionCandidate
