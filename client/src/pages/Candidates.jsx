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
      setError(null);
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
          <div className='candidates_title'>
            <span className='candidates_kicker'>Ballot access</span>
            <h1>Vote a candidate</h1>
            <p className='candidates_lead'>
              Choose your preferred candidate. Each verified voter can cast one vote per
              election. Final results are published once voting ends.
            </p>
          </div>
          <div className='candidates_meta'>
            <div className='candidates_meta-card'>
              <span className='candidates_meta-label'>Rule</span>
              <strong>One vote per election</strong>
            </div>
            <div className='candidates_meta-card'>
              <span className='candidates_meta-label'>Security</span>
              <strong>Verified voter access</strong>
            </div>
            <div className='candidates_meta-card'>
              <span className='candidates_meta-label'>Results</span>
              <strong>Published at close</strong>
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
