import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Election from "../Components/Election";
import AddElectionModal from "../Components/AddElectionModal";
import UpdateElectionModal from "../Components/UpdateElectionModal";
import { uiActions } from "../store/uiSlice";
import { fetchElections } from "../utils/apiSimulator";

const Elections = () => {
  const dispatch = useDispatch();
  const updateModalShowing = useSelector(state => state.ui.updateElectionModalShowing);
  const selectedElection = useSelector(state => state.ui.selectedElection);
  const [elections, setElections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getElections = async () => {
      try {
        const response = await fetchElections();
        if (response.success) {
          setElections(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError("Failed to fetch elections.");
      } finally {
        setIsLoading(false);
      }
    };
    getElections();
  }, []);

  const handleElectionAdded = (newElection) => {
    setElections(prevElections => [...prevElections, newElection]);
    handleCloseModal();
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  if (isLoading) {
    return <section className="elections"><div className="container">Loading elections...</div></section>;
  }

  if (error) {
    return <section className="elections"><div className="container" style={{color: 'red'}}>Error: {error}</div></section>;
  }

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
            {elections.length > 0 ? (
              elections.map(election => (
                <Election key={election.id} {...election} />
              ))
            ) : (
              <p>No elections available. Create one!</p>
            )}
          </div>
        </div>
      </section>

      {showModal && <AddElectionModal onClose={handleCloseModal} onElectionAdded={handleElectionAdded} />}
      {updateModalShowing && (
        <UpdateElectionModal
          onClose={() => {
            dispatch(uiActions.closeUpdateElectionModal());
          }}
          onElectionUpdated={(updatedElection) => {
            setElections(prevElections =>
              prevElections.map(election =>
                election.id === updatedElection.id ? updatedElection : election
              )
            );
          }}
          electionData={selectedElection}
        />
      )}
    </>
  );
};

export default Elections;
