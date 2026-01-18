import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const isYouTubeUrl = (url) => {
  return url.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
};

const isVimeoUrl = (url) => {
  return url.match(/^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/);
};

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

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const NewsPost = ({
  id,
  title,
  content,
  author,
  date,
  mediaUrl,
  mediaType,
  category,
  sourceUrl,
  searchTokens = [],
  detailHref = null,
  detailState = null,
  canDelete = false,
  isDeleting = false,
  onDelete,
}) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const resolvedDate = date ? new Date(date) : new Date();
  const timeAgo = Number.isNaN(resolvedDate.getTime())
    ? 'just now'
    : formatDistanceToNow(resolvedDate, { addSuffix: true });
  const categoryLabel = typeof category === 'string' ? category.trim() : '';
  const titleLabel = typeof title === 'string' ? title.trim() : '';
  const rawHeading = titleLabel || String(id || '');
  const headingId = `news-${rawHeading.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
  const showCategory = categoryLabel
    && (!titleLabel || !titleLabel.toLowerCase().startsWith(`${categoryLabel.toLowerCase()}:`));
  const sourceLink = typeof sourceUrl === 'string' ? sourceUrl.trim() : '';
  const showSourceLink =
    sourceLink &&
    isValidUrl(sourceLink) &&
    !(mediaType === 'embed' && sourceLink === mediaUrl);
  
  const highlightText = (text) => {
    if (!text || !searchTokens.length) return text;
    const safeTokens = searchTokens.map(escapeRegExp).filter(Boolean);
    if (!safeTokens.length) return text;
    const regex = new RegExp(`(${safeTokens.join('|')})`, 'gi');
    const parts = String(text).split(regex);
    return parts.map((part, index) => (
      index % 2 === 1
        ? <mark key={`${part}-${index}`} className="news_highlight">{part}</mark>
        : part
    ));
  };

  const renderMedia = () => {
    if (!mediaUrl) return null;
    
    if (mediaType === 'image' && !imageError) {
      return (
        <div className="news_post-media">
          <img 
            src={mediaUrl} 
            alt={title || 'News post image'}
            onError={() => setImageError(true)}
            loading="lazy"
          />
        </div>
      );
    }
    
    if (mediaType === 'embed' && isYouTubeUrl(mediaUrl)) {
      const embedUrl = getYouTubeEmbedUrl(mediaUrl);
      if (embedUrl) {
        return (
          <div className="news_post-media video-container">
            <iframe
              src={embedUrl}
              title={title || 'Embedded video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        );
      }
    }

    if (mediaType === 'embed' && isDirectVideo(mediaUrl)) {
      return (
        <div className="news_post-media">
          <video controls playsInline preload="metadata">
            <source src={mediaUrl} />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    
    if (mediaType === 'embed' && isVimeoUrl(mediaUrl)) {
      const embedUrl = getVimeoEmbedUrl(mediaUrl) || mediaUrl;
      return (
        <div className="news_post-media video-container">
          <iframe
            src={embedUrl}
            title={title || 'Embedded media'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      );
    }

    if (mediaType === 'embed' && isValidUrl(mediaUrl)) {
      return (
        <div className="news_post-media link-preview">
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            {mediaUrl}
          </a>
        </div>
      );
    }
    
    return null;
  };

  const openDetails = () => {
    if (!detailHref) return;
    navigate(detailHref, { state: { post: detailState } });
  };

  const handleCardClick = (event) => {
    if (!detailHref) return;
    if (event.defaultPrevented) return;
    const target = event.target;
    if (target && target.closest('a, button, iframe, video')) return;
    openDetails();
  };

  const handleCardKeyDown = (event) => {
    if (!detailHref) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openDetails();
    }
  };

  const handleDeleteClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <article
      className={`news_post ${detailHref ? 'news_post--clickable' : ''}`}
      aria-labelledby={headingId}
      role={detailHref ? 'link' : undefined}
      tabIndex={detailHref ? 0 : undefined}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="news_post-content">
        {title && <h3 id={headingId}>{highlightText(title)}</h3>}
        {(showCategory || canDelete) && (
          <div className="news_post-header">
            {showCategory && (
              <span className="news_post-tag" data-category={categoryLabel}>
                {categoryLabel}
              </span>
            )}
            {canDelete && (
              <button
                type="button"
                className="news_post-delete"
                onClick={handleDeleteClick}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>
        )}
        {renderMedia()}
        <p>{highlightText(content)}</p>
        {showSourceLink && (
          <a
            href={sourceLink}
            className="news_post-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read full story
          </a>
        )}
        <footer className="news_post-meta">
          <span className="author">Posted by {author}</span>
          <time dateTime={date} className="timestamp">{timeAgo}</time>
        </footer>
      </div>
    </article>
  );
};

export default NewsPost;
