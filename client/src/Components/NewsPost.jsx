import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

const getYouTubeEmbedUrl = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 
    ? `https://www.youtube.com/embed/${match[2]}` 
    : null;
};

const buildExcerpt = (value, maxLength = 220) => {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  const clipped = trimmed.slice(0, maxLength);
  return `${clipped.replace(/\s+\S*$/, '')}…`;
};

const NewsPost = ({
  id,
  title,
  content,
  summary,
  author,
  date,
  mediaUrl,
  mediaType,
  category,
}) => {
  const [imageError, setImageError] = useState(false);
  const publishedAt = date ? new Date(date) : null;
  const timeAgo =
    publishedAt && !Number.isNaN(publishedAt.getTime())
      ? formatDistanceToNow(publishedAt, { addSuffix: true })
      : 'Recently';
  const headingId = title ? `news-${title.replace(/\s+/g, '-')}` : undefined;
  const excerpt = useMemo(
    () => buildExcerpt(summary || content || ''),
    [summary, content]
  );
  const detailPath = id ? `/news/${id}` : null;
  
  const renderMedia = () => {
    if (!mediaUrl) return null;
    
    if (mediaType === 'image' && !imageError) {
      return (
        <div
          className="news_post-media news_post-media--image"
          style={mediaUrl ? { '--news-image': `url("${mediaUrl}")` } : undefined}
        >
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

  return (
    <article className="news_post" aria-labelledby={headingId}>
      <div className="news_post-content">
        <div className="news_post-header">
          {category && (
            <span className="news_post-tag" data-category={category}>
              {category}
            </span>
          )}
        </div>
        {title && detailPath ? (
          <h3 id={headingId}>
            <Link to={detailPath}>{title}</Link>
          </h3>
        ) : (
          title && <h3 id={headingId}>{title}</h3>
        )}
        {renderMedia()}
        {excerpt && <p>{excerpt}</p>}
        {detailPath && (
          <Link className="news_post-link" to={detailPath}>
            Read full story
          </Link>
        )}
        <footer className="news_post-meta">
          <span className="author">Posted by {author || 'Admin'}</span>
          <time dateTime={publishedAt ? publishedAt.toISOString() : undefined} className="timestamp">
            {timeAgo}
          </time>
        </footer>
      </div>
    </article>
  );
};

export default NewsPost;
