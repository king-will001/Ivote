import React, { useState } from "react";
import { elections as dummyElection } from "../Data";
import Election from "../Components/Election";
import AddElectionModal from "../Components/AddElectionModal";
import UpdateElectionModal from "../Components/UpdateElectionModal";
import { useSelector, useDispatch } from "react-redux";
import { uiActions } from "../store/uiSlice";

const Elections = () => {
  const [elections] = useState(dummyElection);
  const [showModal, setShowModal] = useState(false);

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const dispatch = useDispatch()
  const updateElectionModalShowing = useSelector(state => state.ui.updateElectionModalShowing);
  const handleCloseUpdateModal = () => dispatch(uiActions.closeUpdateElectionModal())

  return (
    <>
      <section className="elections">
        <div className="container elections_container">
          <header className="elections_header">
            <h1>Ongoing Elections</h1>
            <p>Vote for your favorite candidates</p>
            <button className="btn primary" onClick={handleOpenModal}>
              Create Election
            </button>
          </header>
          <div className="elections_menu">
            {elections.map(election => (
              <Election key={election.id} {...election} />
            ))}
          </div>
        </div>
      </section>

      {showModal && <AddElectionModal onClose={handleCloseModal} />}
      {updateElectionModalShowing && <UpdateElectionModal onClose={handleCloseUpdateModal} />}
    </>
  );
};

export default Elections;