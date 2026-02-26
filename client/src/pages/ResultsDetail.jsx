import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CandidateRating from '../Components/CandidateRating';
import { fetchElectionResult } from '../utils/apiSimulator';
import { exportResultsPdf } from '../utils/pdfExport';

const ADMIN_POLL_MS = 10000;

const formatDate = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString();
};

const ResultsDetail = () => {
  const { id } = useParams();
  const user = useSelector((state) => state.auth?.user);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareNote, setShareNote] = useState('');

  const loadResult = useCallback(
    async (showLoader = true) => {
      if (!id) {
        setError('Election ID is missing.');
        setIsLoading(false);
        return;
      }

      if (showLoader) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetchElectionResult(id, {
          includeLiveForOpen: Boolean(user?.isAdmin),
          auth: Boolean(user?.isAdmin),
        });
        if (response.success) {
          setResult(response.data);
        } else if (showLoader) {
          setError(response.message || 'Failed to load election results.');
        }
      } catch (err) {
        if (showLoader) {
          setError('Failed to load election results.');
        }
      } finally {
        if (showLoader) {
          setIsLoading(false);
        }
      }
    },
    [id, user?.isAdmin]
  );

  useEffect(() => {
    loadResult(true);
  }, [loadResult]);

  useEffect(() => {
    if (!result?.showProgress) return undefined;
    const intervalId = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadResult(false);
    }, ADMIN_POLL_MS);
    return () => clearInterval(intervalId);
  }, [result?.showProgress, loadResult]);

  const sortedCandidates = useMemo(() => {
    if (!Array.isArray(result?.candidates)) return [];
    return [...result.candidates].sort((a, b) => b.voteCount - a.voteCount);
  }, [result?.candidates]);
  const canShowResults = Boolean(result?.isClosed || result?.showProgress);
  const topCandidates = useMemo(() => {
    if (!canShowResults || sortedCandidates.length === 0) return [];
    const topVoteCount = Number(sortedCandidates[0]?.voteCount) || 0;
    if (topVoteCount <= 0) return [];
    return sortedCandidates.filter(
      (candidate) => (Number(candidate?.voteCount) || 0) === topVoteCount
    );
  }, [canShowResults, sortedCandidates]);
  const topCandidateIds = useMemo(
    () => new Set(topCandidates.map((candidate) => String(candidate.id))),
    [topCandidates]
  );
  const hasTopTie = topCandidates.length > 1;
  const topBadgeLabel = result?.isClosed
    ? hasTopTie
      ? 'Tied winner'
      : 'Winner'
    : hasTopTie
      ? 'Tied lead'
      : 'Leader';
  const winnerSummary = useMemo(() => {
    if (!canShowResults) return '';
    if (topCandidates.length === 0) {
      return result?.isClosed ? 'No winner yet. No votes recorded.' : 'No leader yet.';
    }
    const topNames = topCandidates
      .map((candidate) => candidate?.fullName || 'Unknown candidate')
      .join(', ');
    if (result?.isClosed) {
      return hasTopTie ? `Tied winners: ${topNames}` : `Winner: ${topNames}`;
    }
    return hasTopTie ? `Current tie: ${topNames}` : `Current leader: ${topNames}`;
  }, [canShowResults, topCandidates, result?.isClosed, hasTopTie]);

  const totalVotes = Number.isFinite(Number(result?.totalVotes))
    ? Number(result.totalVotes)
    : 0;
  const candidateCount =
    typeof result?.candidateCount === 'number'
      ? result.candidateCount
      : sortedCandidates.length;
  const badgeClass = result?.isClosed
    ? 'result_badge result_badge--final'
    : result?.showProgress
      ? 'result_badge result_badge--live'
      : 'result_badge result_badge--pending';
  const badgeLabel = result?.isClosed ? 'Final' : result?.showProgress ? 'Live' : 'Locked';
  const startLabel = formatDate(result?.startTime);
  const endLabel = formatDate(result?.endTime);
  const metaLabel = result?.isClosed
    ? `Total votes: ${totalVotes} | Ended: ${endLabel}`
    : result?.showProgress
      ? `Live tally (admin) | Total votes: ${totalVotes} | Ends: ${endLabel}`
      : `Live total votes: ${totalVotes} | Results unlock at: ${endLabel}`;

  const notifyShare = (message) => {
    setShareNote(message);
    window.setTimeout(() => setShareNote(''), 2600);
  };

  const handleDownload = () => {
    if (!canShowResults) return;
    exportResultsPdf({
      title: result?.title,
      totalVotes,
      endLabel,
      candidates: sortedCandidates,
    });
  };

  const handleShare = async () => {
    if (typeof navigator === 'undefined') {
      notifyShare('Sharing is not supported in this browser.');
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location?.origin || '' : '';
    const shareUrl = `${origin}/results/${id}`;
    const topNames = topCandidates
      .map((candidate) => candidate?.fullName || 'Unknown candidate')
      .join(', ');
    const shareText = canShowResults
      ? topNames
        ? result?.isClosed
          ? hasTopTie
            ? `Results for ${result?.title}. Tied winners: ${topNames}. Total votes: ${totalVotes}.`
            : `Results for ${result?.title}. Winner: ${topNames}. Total votes: ${totalVotes}.`
          : hasTopTie
            ? `Results for ${result?.title}. Current tie: ${topNames}. Total votes: ${totalVotes}.`
            : `Results for ${result?.title}. Current leader: ${topNames}. Total votes: ${totalVotes}.`
        : `Results for ${result?.title}. Total votes: ${totalVotes}.`
      : `Results for ${result?.title}. Voting ends at ${endLabel}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Results: ${result?.title}`,
          text: shareText,
          url: shareUrl,
        });
        notifyShare('Thanks for sharing.');
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        notifyShare('Share link copied to clipboard.');
        return;
      }
      notifyShare('Sharing is not supported in this browser.');
    } catch (error) {
      notifyShare('Unable to share right now.');
    }
  };

  if (isLoading) {
    return (
      <section className='results_detail'>
        <div className='container results_detail_shell'>
          <p>Loading election results...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className='results_detail'>
        <div className='container results_detail_shell'>
          <p style={{ color: 'red' }}>{error}</p>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section className='results_detail'>
        <div className='container results_detail_shell'>
          <p>Election results not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className='results_detail'>
      <div className='container results_detail_shell'>
        <div className='results_detail_header'>
          <Link className='results_detail_back' to='/results'>
            Back to results
          </Link>
          <div className='results_detail_header-actions'>
            <Link className='btn sm' to={`/elections/${id}/candidates`}>
              Open election
            </Link>
          </div>
        </div>

        <div className='results_hero results_detail_hero'>
          <div className='results_hero-copy'>
            <span className='results_kicker'>Election results</span>
            <h1>{result.title}</h1>
            <p>{result.description || 'No description provided yet.'}</p>
            <div className='results_detail_meta'>
              <span>Starts: {startLabel}</span>
              <span>Ends: {endLabel}</span>
            </div>
          </div>
          <div className='results_detail_media'>
            <img src={result.thumbnail} alt={result.title} loading='lazy' />
          </div>
        </div>

        <div className='results_detail_stats'>
          <div className='results_stat-card'>
            <span>Total votes</span>
            <strong>{totalVotes}</strong>
            <small>{result.isClosed ? 'Final tally' : 'Live count'}</small>
          </div>
          <div className='results_stat-card'>
            <span>Candidate pool</span>
            <strong>{candidateCount}</strong>
            <small>Running in this election</small>
          </div>
          <div className='results_stat-card'>
            <span>Status</span>
            <strong>{badgeLabel}</strong>
            <small>{result.isClosed ? 'Results published' : 'Voting in progress'}</small>
          </div>
        </div>

        <div className='result results_detail_card'>
          <header className='result_header'>
            <div className='result_header-copy'>
              <span className={badgeClass}>{badgeLabel}</span>
              <h4>{result.title}</h4>
              <p className='result_meta'>{metaLabel}</p>
              {winnerSummary && <p className='result_winner'>{winnerSummary}</p>}
            </div>
            <div className='result_header-image'>
              <img src={result.thumbnail} alt={result.title} loading='lazy' />
            </div>
          </header>

          {canShowResults ? (
            <ul className='result_list'>
              {sortedCandidates.length === 0 ? (
                <li className='result_empty'>No candidates found.</li>
              ) : (
                sortedCandidates.map((candidate) => (
                  <CandidateRating
                    key={candidate.id}
                    {...candidate}
                    totalVotes={totalVotes}
                    isWinner={topCandidateIds.has(String(candidate.id))}
                    badgeLabel={topBadgeLabel}
                  />
                ))
              )}
            </ul>
          ) : (
            <div className='result_pending'>
              <p>Results are hidden while voting is live.</p>
            </div>
          )}

          <div className='result_footer'>
            <div className='result_actions'>
              {canShowResults && (
                <button className='btn' onClick={handleDownload} type='button'>
                  Download PDF
                </button>
              )}
              <button className='btn primary' onClick={handleShare} type='button'>
                Share link
              </button>
            </div>
            {shareNote && <p className='result_share-note'>{shareNote}</p>}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsDetail;
