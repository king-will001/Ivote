import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import Election from "../Components/Election";
import AddElectionModal from "../Components/AddElectionModal";
import UpdateElectionModal from "../Components/UpdateElectionModal";
import { uiActions } from "../store/uiSlice";
import { deleteElection, fetchElections } from "../utils/apiSimulator";

const Elections = () => {
  const dispatch = useDispatch();
  const updateModalShowing = useSelector(state => state.ui.updateElectionModalShowing);
  const selectedElection = useSelector(state => state.ui.selectedElection);
  const user = useSelector(state => state.auth?.user);
  const [elections, setElections] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const getElections = async () => {
      try {
        setError(null);
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

  const electionStats = useMemo(() => {
    const now = Date.now();
    let activeCount = 0;
    let upcomingCount = 0;
    let closedCount = 0;

    elections.forEach((election) => {
      const startValue = election?.startTime || election?.startDate || election?.date;
      const endValue = election?.endTime || election?.endDate;
      const start = startValue ? new Date(startValue).getTime() : NaN;
      const end = endValue ? new Date(endValue).getTime() : NaN;

      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        if (now < start) {
          upcomingCount += 1;
        } else if (now > end) {
          closedCount += 1;
        } else {
          activeCount += 1;
        }
      } else {
        upcomingCount += 1;
      }
    });

    return { activeCount, upcomingCount, closedCount };
  }, [elections]);

  const handleElectionAdded = (newElection) => {
    setElections(prevElections => [...prevElections, newElection]);
    handleCloseModal();
  };

  const handleDeleteElection = async (electionId, electionTitle) => {
    if (!user?.isAdmin) return;
    const confirmed = window.confirm(
      `Delete ${electionTitle || 'this election'}? This will remove all candidates and votes.`
    );
    if (!confirmed) return;

    setActionError(null);
    setDeletingId(electionId);
    try {
      const response = await deleteElection(electionId);
      if (response.success) {
        setElections((prev) => prev.filter((election) => election.id !== electionId));
      } else {
        setActionError(response.message || 'Failed to delete election.');
      }
    } catch (err) {
      setActionError('Failed to delete election.');
    } finally {
      setDeletingId(null);
    }
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
          <div className="elections_hero">
            <div className="elections_hero-copy">
              <span className="elections_kicker">Live governance</span>
              <h1>Ongoing Elections</h1>
              <p>
                Run secure elections, track timelines, and publish results with confidence.
              </p>
              <div className="elections_actions">
                {user?.isAdmin && (
                  <button className="btn primary" onClick={handleOpenModal}>
                    Create Election
                  </button>
                )}
                <Link className="btn" to="/results">
                  View Results
                </Link>
              </div>
            </div>
            <div className="elections_stats">
              <div className="elections_stat-card">
                <span className="elections_stat-label">Active</span>
                <span className="elections_stat-value">{electionStats.activeCount}</span>
                <span className="elections_stat-meta">Elections running</span>
              </div>
              <div className="elections_stat-card">
                <span className="elections_stat-label">Upcoming</span>
                <span className="elections_stat-value">{electionStats.upcomingCount}</span>
                <span className="elections_stat-meta">Scheduled starts</span>
              </div>
            </div>
          </div>

          <div className="elections_list-header">
            <div>
              <h2>Browse elections</h2>
              <p>Open a card to manage candidates, timelines, and voting activity.</p>
              {actionError && (
                <p className="form_error-message" style={{ marginTop: '1rem' }}>
                  {actionError}
                </p>
              )}
            </div>
            <span className="elections_list-count">
              {elections.length} election{elections.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="elections_menu">
            {elections.length > 0 ? (
              elections.map(election => (
                <Election
                  key={election.id}
                  {...election}
                  onDelete={handleDeleteElection}
                  isDeleting={deletingId === election.id}
                />
              ))
            ) : (
              <div className="elections_empty">
                <h3>No elections yet</h3>
                <p>Create an election to start collecting votes.</p>
                {user?.isAdmin && (
                  <button className="btn primary" onClick={handleOpenModal}>
                    Create Election
                  </button>
                )}
              </div>
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
