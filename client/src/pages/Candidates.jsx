import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCandidates, fetchElectionById } from '../utils/apiSimulator';
import { uiActions } from '../store/uiSlice';
import CandidateCard from '../Components/Candidate';
import ConfirmVote from '../Components/ConfirmVote';
import Loader from '../Components/Loader';

const Candidates = () => {
  const { id: electionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);
  const [election, setElection] = useState(null);

  const voteCandidateModalShowing = useSelector((state) => state.ui.voteCandidateModalShowing);

  useEffect(() => {
    const getCandidates = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [candidatesResponse, electionResponse] = await Promise.all([
          fetchCandidates(electionId),
          fetchElectionById(electionId),
        ]);

        if (candidatesResponse.success) {
          setCandidates(candidatesResponse.data);
        } else {
          setError(candidatesResponse.message);
        }

        if (electionResponse.success) {
          setElection(electionResponse.data);
        } else {
          setError(electionResponse.message);
        }
      } catch (err) {
        setError("Failed to fetch candidates.");
      } finally {
        setIsLoading(false);
      }
    };
    getCandidates();
  }, [electionId]);

  const formatDateTime = (value) => {
    if (!value) return "TBD";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "TBD";
    return date.toLocaleString();
  };

  const getVotingStatus = () => {
    if (!election?.startTime || !election?.endTime) {
      return { label: "Voting schedule not set", canVote: true };
    }
    const start = new Date(election.startTime);
    const end = new Date(election.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { label: "Voting schedule not set", canVote: true };
    }
    const now = new Date();
    if (now < start) {
      return { label: "Voting has not started yet", canVote: false };
    }
    if (now > end) {
      return { label: "Voting has ended", canVote: false };
    }
    return { label: "Voting is open", canVote: true };
  };

  const votingStatus = getVotingStatus();
  const electionTitle = election?.title || "Election overview";

  const handleVoteClick = (candidateId) => {
    if (!votingStatus.canVote) {
      return;
    }
    setSelectedCandidateId(candidateId);
    dispatch(uiActions.openVoteCandidateModal());
  };

  const handleCancel = () => {
    setSelectedCandidateId(null);
    dispatch(uiActions.closeVoteCandidateModal());
  };

  const handleConfirm = () => {
    setSelectedCandidateId(null);
    dispatch(uiActions.closeVoteCandidateModal());
    navigate('/congrates'); // Redirect after successful vote
  };

  if (isLoading) {
    return (
      <section className="candidates">
        <div className="container">
          <Loader label="Loading candidates..." size="lg" fullPage />
        </div>
      </section>
    );
  }

  if (error) {
    return <section className="candidates"><div className="container" style={{color: 'red'}}>Error: {error}</div></section>;
  }

  return (
    <>
      <section className='candidates'>
        <header className='candidates_header'>
          <div className="candidates_title">
            <span className="candidates_kicker">{electionTitle}</span>
            <h1>Vote a candidate</h1>
            <p className="candidates_lead">
              Choose your favorite candidate. You can vote for one candidate per election.
              The candidate with the most votes will win the election.
            </p>
          </div>
          <div className="candidates_meta">
            <div className="candidates_meta-card">
              <span className="candidates_meta-label">Starts</span>
              <strong>{formatDateTime(election?.startTime)}</strong>
            </div>
            <div className="candidates_meta-card">
              <span className="candidates_meta-label">Ends</span>
              <strong>{formatDateTime(election?.endTime)}</strong>
            </div>
            <div className={`candidates_meta-card candidates_meta-status ${votingStatus.canVote ? 'is-open' : 'is-closed'}`}>
              <span className="candidates_meta-label">Status</span>
              <strong>{votingStatus.label}</strong>
            </div>
          </div>
        </header>

        <div className='container candidates_container'>
          {candidates.length === 0 ? (
            <p>No candidates found for this election.</p>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                {...candidate}
                canVote={votingStatus.canVote}
                onVote={() => handleVoteClick(candidate.id)}
              />
            ))
          )}
        </div>
      </section>

      {voteCandidateModalShowing && selectedCandidateId && (
        <ConfirmVote
          electionId={electionId}
          candidateId={selectedCandidateId}
          onCancel={handleCancel}
          onConfirm={handleConfirm}
        />
      )}
    </>
  );
};

export default Candidates;
