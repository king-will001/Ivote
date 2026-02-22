import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import { deleteNews, fetchNewsById } from '../utils/apiSimulator';

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
};

const isYouTubeUrl = (url) =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url || '');

const getYouTubeEmbedUrl = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = String(url || '').match(regExp);
  return match && match[2]?.length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const formatDateTime = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString();
};

const NewsDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadPost = useCallback(async () => {
    if (!id) {
      setError('News ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchNewsById(id);
      if (response.success) {
        setPost(response.data);
      } else {
        setError(response.message || 'Failed to load news post.');
      }
    } catch (err) {
      setError('Failed to load news post.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const summaryText = useMemo(() => {
    if (!post) return '';
    const base =
      (typeof post.summary === 'string' && post.summary) ||
      (typeof post.content === 'string' && post.content) ||
      '';
    return base.trim();
  }, [post]);

  const timeAgo = useMemo(() => {
    if (!post?.date) return 'Recently';
    const date = new Date(post.date);
    if (Number.isNaN(date.getTime())) return 'Recently';
    return formatDistanceToNow(date, { addSuffix: true });
  }, [post?.date]);

  const handleDelete = async () => {
    if (!post?.id || isDeleting) return;
    const confirmed = window.confirm(
      `Delete "${post.title || 'this post'}"? This action cannot be undone.`
    );
    if (!confirmed) return;
    setIsDeleting(true);
    setError(null);
    try {
      const response = await deleteNews(post.id);
      if (response.success) {
        navigate('/', { replace: true });
      } else {
        setError(response.message || 'Failed to delete news post.');
      }
    } catch (err) {
      setError('Failed to delete news post.');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderMedia = () => {
    if (!post?.mediaUrl || !post?.mediaType) return null;

    if (post.mediaType === 'image') {
      return (
        <div className="news_detail-media-wrap">
          <div className="news_detail-media">
            <img src={post.mediaUrl} alt={post.title || 'News image'} loading="lazy" />
          </div>
        </div>
      );
    }

    if (post.mediaType === 'embed' && isYouTubeUrl(post.mediaUrl)) {
      const embedUrl = getYouTubeEmbedUrl(post.mediaUrl);
      if (embedUrl) {
        return (
          <div className="news_detail-media-wrap">
            <div className="news_detail-media news_detail-media--video">
              <iframe
                src={embedUrl}
                title={post.title || 'News video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        );
      }
    }

    if (post.mediaType === 'embed' && isValidUrl(post.mediaUrl)) {
      return (
        <div className="news_detail-media-wrap">
          <div className="news_detail-media news_detail-media--link">
            <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">
              Open embedded link
            </a>
          </div>
        </div>
      );
    }

    if (post.mediaType === 'link' && isValidUrl(post.mediaUrl)) {
      return (
        <div className="news_detail-media-wrap">
          <div className="news_detail-media news_detail-media--link">
            <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">
              Open source link
            </a>
          </div>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <section className="news_detail">
        <div className="container news_detail-shell">
          <p>Loading news post...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="news_detail">
        <div className="container news_detail-shell">
          <div className="news_detail-empty">
            <p style={{ color: 'red' }}>{error}</p>
            <Link className="news_detail-back" to="/">
              Back to news
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (!post) {
    return (
      <section className="news_detail">
        <div className="container news_detail-shell">
          <div className="news_detail-empty">
            <p>News post not found.</p>
            <Link className="news_detail-back" to="/">
              Back to news
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="news_detail">
      <div className="container news_detail-shell">
        <div className="news_detail-hero">
          <div className="news_detail-hero-top">
            <Link className="news_detail-back" to="/">
              Back to news
            </Link>
            {post.category && (
              <span className="news_detail-tag" data-category={post.category}>
                {post.category}
              </span>
            )}
          </div>

          <div className="news_detail-hero-main">
            <div className="news_detail-hero-copy">
              <span className="news_detail-eyebrow">News bulletin</span>
              <h1>{post.title}</h1>
              {summaryText && <p className="news_detail-summary">{summaryText}</p>}
              <div className="news_detail-meta">
                <span>{post.author || 'Admin'}</span>
                <time dateTime={post.date || undefined}>{timeAgo}</time>
                {post.mediaType && <span>{post.mediaType}</span>}
              </div>
            </div>

            <aside className="news_detail-panel">
              <div className="news_detail-panel-row">
                <span>Published</span>
                <strong>{formatDateTime(post.date)}</strong>
              </div>
              <div className="news_detail-panel-row">
                <span>Category</span>
                <strong>{post.category || 'General'}</strong>
              </div>
              <div className="news_detail-panel-row">
                <span>Author</span>
                <strong>{post.author || 'Admin'}</strong>
              </div>
              <p className="news_detail-panel-note">
                This update is curated by the IVote admin team.
              </p>
              {post.sourceUrl && (
                <a
                  className="btn"
                  href={post.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit source
                </a>
              )}
              {user?.isAdmin && (
                <button
                  type="button"
                  className="btn"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete post'}
                </button>
              )}
            </aside>
          </div>
        </div>

        <div className="news_detail-article">
          {renderMedia()}
          <div className="news_detail-body">
            <p>{post.content}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsDetail;
