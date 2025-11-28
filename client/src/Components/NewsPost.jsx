import React, { useState } from 'react';
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

const NewsPost = ({ title, content, author, date, mediaUrl, mediaType }) => {
  const [imageError, setImageError] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: true });
  
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
    <article className="news_post" aria-labelledby={`news-${title?.replace(/\s+/g, '-')}`}>
      <div className="news_post-content">
        {title && <h3 id={`news-${title.replace(/\s+/g, '-')}`}>{title}</h3>}
        {renderMedia()}
        <p>{content}</p>
        <footer className="news_post-meta">
          <span className="author">Posted by {author}</span>
          <time dateTime={date} className="timestamp">{timeAgo}</time>
        </footer>
      </div>
    </article>
  );
};

export default NewsPost;