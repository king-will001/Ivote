import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { fetchNewsById } from '../utils/apiSimulator';
import Loader from '../Components/Loader';

const isValidUrl = (value) => {
  try {
    new URL(value);
    return true;
  } catch (_) {
    return false;
  }
};

const isYouTubeUrl = (url) => (
  url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
);

const isVimeoUrl = (url) => (
  url.match(/^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/)
);

const getYouTubeEmbedUrl = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
};

const getVimeoEmbedUrl = (url) => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? `https://player.vimeo.com/video/${match[1]}` : null;
};

const isDirectVideo = (url) => /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);

const formatDateTime = (value) => {
  if (!value) return 'TBD';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return date.toLocaleString();
};

const NewsDetails = () => {
  const { id: encodedId } = useParams();
  const location = useLocation();
  const initialPost = location.state?.post || null;
  const decodedId = useMemo(() => {
    if (!encodedId) return '';
    try {
      return decodeURIComponent(encodedId);
    } catch (_) {
      return encodedId;
    }
  }, [encodedId]);
  const initialMatches = initialPost && String(initialPost.id) === String(decodedId);
  const [post, setPost] = useState(initialMatches ? initialPost : null);
  const [isLoading, setIsLoading] = useState(!initialMatches);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isActive = true;

    const loadPost = async ({ silent = false } = {}) => {
      if (!decodedId) {
        if (!silent) {
          setError('News post not found.');
        }
        setIsLoading(false);
        return;
      }

      if (!silent) {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetchNewsById(decodedId);
        if (!isActive) return;
        if (response.success) {
          setPost(response.data);
        } else if (!silent) {
          setError(response.message || 'News post not found.');
        }
      } catch (err) {
        if (!isActive) return;
        if (!silent) {
          setError('Failed to load the news post.');
        }
      } finally {
        if (!isActive) return;
        if (!silent) {
          setIsLoading(false);
        }
      }
    };

    loadPost({ silent: initialMatches });
    return () => {
      isActive = false;
    };
  }, [decodedId, initialMatches]);

  if (isLoading) {
    return (
      <section className="news_detail">
        <div className="container">
          <Loader label="Loading news post..." size="lg" fullPage />
        </div>
      </section>
    );
  }

  if (error || !post) {
    return (
      <section className="news_detail">
        <div className="container news_detail-empty">
          <p>{error || 'News post not found.'}</p>
          <Link to="/" className="btn">Back to News</Link>
        </div>
      </section>
    );
  }

  const resolvedDate = formatDateTime(post.date || post.createdAt);
  const categoryLabel = typeof post.category === 'string' ? post.category.trim() : '';
  const sourceLink = typeof post.sourceUrl === 'string' ? post.sourceUrl.trim() : '';
  const showSourceLink = sourceLink && isValidUrl(sourceLink);
  const rawSummary = post.summary || post.description || '';
  const summaryText = typeof rawSummary === 'string' ? rawSummary.trim() : '';
  const rawBody = post.content || post.body || post.description || post.summary || '';
  const bodyText = typeof rawBody === 'string' ? rawBody.trim() : '';
  const showSummary = summaryText && summaryText !== bodyText;
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
  const readTime = wordCount ? Math.max(1, Math.round(wordCount / 180)) : null;
  const paragraphs = bodyText
    ? bodyText.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  const renderMedia = () => {
    if (!post.mediaUrl) return null;

    if (post.mediaType === 'image') {
      return (
        <div className="news_detail-media">
          <img src={post.mediaUrl} alt={post.title || 'News media'} />
        </div>
      );
    }

    if (post.mediaType === 'embed' && isYouTubeUrl(post.mediaUrl)) {
      const embedUrl = getYouTubeEmbedUrl(post.mediaUrl);
      if (embedUrl) {
        return (
          <div className="news_detail-media news_detail-media--video">
            <iframe
              src={embedUrl}
              title={post.title || 'Embedded video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        );
      }
    }

    if (post.mediaType === 'embed' && isDirectVideo(post.mediaUrl)) {
      return (
        <div className="news_detail-media news_detail-media--video">
          <video controls playsInline preload="metadata">
            <source src={post.mediaUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (post.mediaType === 'embed' && isValidUrl(post.mediaUrl)) {
      const vimeoEmbed = isVimeoUrl(post.mediaUrl)
        ? getVimeoEmbedUrl(post.mediaUrl)
        : null;
      if (vimeoEmbed) {
        return (
          <div className="news_detail-media news_detail-media--video">
            <iframe
              src={vimeoEmbed}
              title={post.title || 'Embedded media'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        );
      }
      return (
        <div className="news_detail-media news_detail-media--link">
          <a href={post.mediaUrl} target="_blank" rel="noopener noreferrer">
            Open external media
          </a>
        </div>
      );
    }

    return null;
  };

  const media = renderMedia();
  const authorLabel = post.author || 'Admin';

  return (
    <section className="news_detail">
      <div className="container news_detail-shell">
        <header className="news_detail-hero">
          <div className="news_detail-hero-top">
            <Link to="/" className="news_detail-back">
              <span aria-hidden="true">&larr;</span>
              Back to News
            </Link>
            {categoryLabel && (
              <span className="news_detail-tag" data-category={categoryLabel}>
                {categoryLabel}
              </span>
            )}
          </div>

          <div className="news_detail-hero-main">
            <div className="news_detail-hero-copy">
              <span className="news_detail-eyebrow">Newsroom Brief</span>
              <h1>{post.title}</h1>
              {showSummary && (
                <p className="news_detail-summary">{summaryText}</p>
              )}
              <div className="news_detail-meta">
                <span>Posted by {authorLabel}</span>
                <time dateTime={post.date || post.createdAt}>{resolvedDate}</time>
                {readTime && <span>{readTime} min read</span>}
              </div>
            </div>

            <aside className="news_detail-panel">
              <div className="news_detail-panel-row">
                <span>Category</span>
                <strong>{categoryLabel || 'General'}</strong>
              </div>
              <div className="news_detail-panel-row">
                <span>Published</span>
                <strong>{resolvedDate}</strong>
              </div>
              <div className="news_detail-panel-row">
                <span>By</span>
                <strong>{authorLabel}</strong>
              </div>
              {showSourceLink ? (
                <a
                  className="btn primary news_detail-source"
                  href={sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read source
                </a>
              ) : (
                <p className="news_detail-panel-note">
                  Curated for the IvoTe newsroom.
                </p>
              )}
            </aside>
          </div>
        </header>

        <article className="news_detail-article">
          {media && <div className="news_detail-media-wrap">{media}</div>}
          <div className="news_detail-body">
            {paragraphs.length ? (
              paragraphs.map((paragraph, index) => (
                <p key={`${post.id || 'news'}-${index}`}>{paragraph}</p>
              ))
            ) : (
              <p>No story text available yet.</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default NewsDetails;
