import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCandidates } from '../utils/apiSimulator';
import { uiActions } from '../store/uiSlice';
import CandidateCard from '../Components/Candidate';
import ConfirmVote from '../Components/ConfirmVote';

const Candidates = () => {
  const { id: electionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState(null);

  const voteCandidateModalShowing = useSelector((state) => state.ui.voteCandidateModalShowing);

  useEffect(() => {
    const getCandidates = async () => {
      setIsLoading(true);
      try {
        const response = await fetchCandidates(electionId);
        if (response.success) {
          setCandidates(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError("Failed to fetch candidates.");
      } finally {
        setIsLoading(false);
      }
    };
    getCandidates();
  }, [electionId]);

  const handleVoteClick = (candidateId) => {
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
    return <section className="candidates"><div className="container">Loading candidates...</div></section>;
  }

  if (error) {
    return <section className="candidates"><div className="container" style={{color: 'red'}}>Error: {error}</div></section>;
  }

  return (
    <>
      <section className='candidates'>
        <header className='candidates_header'>
          <h1>Vote a candidate</h1>
          <p>
            Choose your favorite candidate. You can vote for one candidate per election.
            The candidate with the most votes will win the election.
          </p>
        </header>

        <div className='container candidates_container'>
          {candidates.length === 0 ? (
            <p>No candidates found for this election.</p>
          ) : (
            candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                {...candidate}
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
