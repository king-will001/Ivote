import React from 'react'
import { IoMdTrash } from 'react-icons/io'

const ElectionCandidate = ({ fullName, image, motto, id }) => {
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
        <button className="electionCandidate_btn">
          <IoMdTrash />
        </button>
      </div>
    </li>
  )
}


export default ElectionCandidate
