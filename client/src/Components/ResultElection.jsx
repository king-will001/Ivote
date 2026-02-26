import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CandidateRating from '../Components/CandidateRating';
import { exportResultsPdf } from '../utils/pdfExport';

const formatDate = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString();
};

const ResultElection = ({
  id,
  thumbnail,
  title,
  candidates = [],
  totalVotes = 0,
  endTime,
  isClosed,
  showProgress = false,
}) => {
  const [shareNote, setShareNote] = useState('');
  const resolvedClosed =
    typeof isClosed === 'boolean'
      ? isClosed
      : (() => {
          const endValue = endTime;
          if (!endValue) return false;
          const endDate = new Date(endValue).getTime();
          if (Number.isNaN(endDate)) return false;
          return Date.now() >= endDate;
        })();

  const canShowResults = resolvedClosed || showProgress;

  const sortedCandidates = useMemo(() => {
    if (!canShowResults) return [];
    return [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  }, [candidates, canShowResults]);

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
  const topBadgeLabel = resolvedClosed
    ? hasTopTie
      ? 'Tied winner'
      : 'Winner'
    : hasTopTie
      ? 'Tied lead'
      : 'Leader';

  const winnerSummary = useMemo(() => {
    if (!canShowResults) return '';
    if (topCandidates.length === 0) {
      return resolvedClosed ? 'No winner yet. No votes recorded.' : 'No leader yet.';
    }

    const topNames = topCandidates
      .map((candidate) => candidate?.fullName || 'Unknown candidate')
      .join(', ');

    if (resolvedClosed) {
      return hasTopTie ? `Tied winners: ${topNames}` : `Winner: ${topNames}`;
    }

    return hasTopTie ? `Current tie: ${topNames}` : `Current leader: ${topNames}`;
  }, [canShowResults, topCandidates, resolvedClosed, hasTopTie]);

  const badgeClass = resolvedClosed
    ? 'result_badge result_badge--final'
    : showProgress
      ? 'result_badge result_badge--live'
      : 'result_badge result_badge--pending';
  const badgeLabel = resolvedClosed ? 'Final' : showProgress ? 'Live' : 'Locked';
  const endLabel = formatDate(endTime);
  const resolvedTotalVotes = Number.isFinite(Number(totalVotes)) ? Number(totalVotes) : 0;

  const metaLabel = resolvedClosed
    ? `Total votes: ${resolvedTotalVotes}`
    : showProgress
      ? `Live tally (admin) | Total votes: ${resolvedTotalVotes} | Ends: ${endLabel}`
      : `Live total votes: ${resolvedTotalVotes} | Results unlock at: ${endLabel}`;

  const notifyShare = (message) => {
    setShareNote(message);
    window.setTimeout(() => setShareNote(''), 2600);
  };

  const handleDownload = () => {
    if (!resolvedClosed) return;
    exportResultsPdf({
      title,
      totalVotes,
      endLabel,
      candidates: sortedCandidates,
    });
  };

  const handleShare = async () => {
    if (!resolvedClosed) return;
    if (typeof navigator === 'undefined') {
      notifyShare('Sharing is not supported in this browser.');
      return;
    }
    const origin = window.location?.origin || '';
    const shareUrl = `${origin}/results/${id}`;
    const topCandidateNames = topCandidates
      .map((candidate) => candidate?.fullName || 'Unknown candidate')
      .join(', ');
    const shareText = topCandidateNames
      ? hasTopTie
        ? `Final results for ${title}. Tied winners: ${topCandidateNames}. Total votes: ${totalVotes}.`
        : `Final results for ${title}. Winner: ${topCandidateNames}. Total votes: ${totalVotes}.`
      : `Final results for ${title}. Total votes: ${totalVotes}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Results: ${title}`,
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

  return (
    <article className='result'>
      <header className='result_header'>
        <div className='result_header-copy'>
          <span className={badgeClass}>{badgeLabel}</span>
          <h4>{title}</h4>
          <p className='result_meta'>{metaLabel}</p>
          {winnerSummary && <p className='result_winner'>{winnerSummary}</p>}
        </div>
        <div className='result_header-image'>
          <img src={thumbnail} alt={title} loading='lazy' decoding='async' />
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
          <Link to={`/results/${id}`} className='btn primary'>
            View details
          </Link>
          {resolvedClosed && (
            <>
              <button className='btn' onClick={handleDownload} type='button'>
                Download PDF
              </button>
              <button className='btn' onClick={handleShare} type='button'>
                Share
              </button>
            </>
          )}
        </div>
        {shareNote && <p className='result_share-note'>{shareNote}</p>}
      </div>
    </article>
  );
};

export default ResultElection;
