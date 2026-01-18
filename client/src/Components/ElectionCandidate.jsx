import React, { useContext } from 'react'
import { IoMdTrash } from 'react-icons/io'
import { UserContext } from '../context/userContext'

const ElectionCandidate = ({ fullName, image, motto, id, onDelete, onVote, canVote = true }) => {
  const { currentUser } = useContext(UserContext);
  const isAdmin = currentUser?.isAdmin || currentUser?.voter?.isAdmin;
  const voteDisabled = !canVote;

  const handleVote = () => {
    if (voteDisabled) return;
    if (onVote) onVote(id);
  };

  return (
    <li className="electionCandidate">
      <div className="electionCandidate_image">
        <img src={image} alt={fullName} />
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
          {isAdmin && onDelete && (
            <button className="electionCandidate_btn" onClick={() => onDelete(id)}>
              <IoMdTrash />
            </button>
          )}
          <button className="btn sm primary electionCandidate_vote" onClick={handleVote} disabled={voteDisabled}>
            {voteDisabled ? 'Voting Closed' : 'Vote'}
          </button>
        </div>
      </div>
    </li>
  )
}

export default ElectionCandidate
