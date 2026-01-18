import React, { useState, useContext } from "react";
import { elections as dummyElection } from "../Data";
import Election from "../Components/Election";
import AddElectionModal from "../Components/AddElectionModal";
import UpdateElectionModal from "../Components/UpdateElectionModal";
import { useSelector, useDispatch } from "react-redux";
import { uiActions } from "../store/uiSlice";
import { UserContext } from "../context/userContext";

const getElectionPhase = (startTime, endTime, now = new Date()) => {
  if (!startTime || !endTime) {
    return { key: "unscheduled", label: "Unscheduled" };
  }

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { key: "unscheduled", label: "Unscheduled" };
  }

  if (now < start) {
    return { key: "upcoming", label: "Upcoming" };
  }

  if (now > end) {
    return { key: "closed", label: "Closed" };
  }

  return { key: "live", label: "Live" };
};

const Elections = () => {
  const [elections] = useState(dummyElection);
  const [showModal, setShowModal] = useState(false);
  const { currentUser } = useContext(UserContext);
  const isAdmin = currentUser?.isAdmin || currentUser?.voter?.isAdmin;
  const now = new Date();
  const stats = elections.reduce(
    (acc, election) => {
      const phase = getElectionPhase(election.startTime, election.endTime, now).key;
      acc.total += 1;
      acc[phase] += 1;
      return acc;
    },
    { total: 0, live: 0, upcoming: 0, closed: 0, unscheduled: 0 }
  );

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const dispatch = useDispatch()
  const updateElectionModalShowing = useSelector(state => state.ui.updateElectionModalShowing);
  const handleCloseUpdateModal = () => dispatch(uiActions.closeUpdateElectionModal())

  return (
    <>
      <section className="elections">
        <div className="container elections_container">
          <header className="elections_hero">
            <div className="elections_hero-copy">
              <span className="elections_kicker">Elections Center</span>
              <h1>Run elections with clarity, schedule, and trust.</h1>
              <p>
                Track timelines, manage candidates, and keep every election transparent
                from start to finish.
              </p>
              {isAdmin && (
                <div className="elections_actions">
                  <button className="btn primary" onClick={handleOpenModal}>
                    Create Election
                  </button>
                </div>
              )}
            </div>
            <div className="elections_stats">
              <div className="elections_stat-card">
                <span className="elections_stat-label">Total elections</span>
                <strong className="elections_stat-value">{stats.total}</strong>
                <span className="elections_stat-meta">All cycles</span>
              </div>
              <div className="elections_stat-card">
                <span className="elections_stat-label">Live now</span>
                <strong className="elections_stat-value">{stats.live}</strong>
                <span className="elections_stat-meta">Voting open</span>
              </div>
              <div className="elections_stat-card">
                <span className="elections_stat-label">Upcoming</span>
                <strong className="elections_stat-value">{stats.upcoming}</strong>
                <span className="elections_stat-meta">Scheduled</span>
              </div>
              <div className="elections_stat-card">
                <span className="elections_stat-label">Completed</span>
                <strong className="elections_stat-value">{stats.closed}</strong>
                <span className="elections_stat-meta">Finished</span>
              </div>
            </div>
          </header>

          <div className="elections_list-header">
            <div>
              <h2>Election Directory</h2>
              <p>Browse active, upcoming, and completed elections.</p>
            </div>
            <div className="elections_list-count">
              {elections.length} {elections.length === 1 ? "election" : "elections"}
            </div>
          </div>
          <div className="elections_menu">
            {elections.map(election => (
              <Election key={election.id} {...election} />
            ))}
          </div>
        </div>
      </section>

      {isAdmin && showModal && <AddElectionModal onClose={handleCloseModal} />}
      {isAdmin && updateElectionModalShowing && <UpdateElectionModal onClose={handleCloseUpdateModal} />}
    </>
  );
};

export default Elections;
