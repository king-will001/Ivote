import React from 'react'
import { IoMdTrash } from 'react-icons/io'

const ElectionCandidate = ({
  fullName,
  image,
  motto,
  id,
  onDelete,
  onVote,
  isDeleting = false,
}) => {
  return (
    <li className="electionCandidate">
      <div className="electionCandidate_image">
        <img src={image} alt={fullName} loading="lazy" decoding="async" />
      </div>
      <div className="electionCandidate_info">
        <h5>{fullName}</h5>
        <small>
          {motto?.length > 80 ? motto.slice(0, 80) + "..." : motto}
        </small>
        <div className="electionCandidate_id">
          <span>Candidate ID</span>
          <span>{id}</span>
        </div>
        <div className="electionCandidate_actions">
          {onDelete && (
            <button
              className="electionCandidate_btn"
              onClick={() => onDelete(id)}
              aria-label={`Delete ${fullName}`}
              type="button"
              disabled={isDeleting}
            >
              <IoMdTrash />
            </button>
          )}
          <button
            className="btn primary electionCandidate_vote"
            onClick={() => onVote && onVote(id)}
            type="button"
          >
            Vote
          </button>
        </div>
      </div>
    </li>
  )
}

export default ElectionCandidate
