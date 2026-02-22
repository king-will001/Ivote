import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { createNews } from '../utils/apiSimulator';
import classes from './AddElectionModal.module.css'; // Re-use styles from AddElectionModal

const AddNewsModal = ({ onClose, onNewsAdded }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState('none');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaFile, setMediaFile] = useState(null);

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number') return '';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleMediaTypeChange = (e) => {
    setMediaType(e.target.value);
    setMediaUrl('');
    setPreviewUrl('');
    setMediaFile(null);
  };

  const handleMediaUrlChange = (e) => {
    const url = e.target.value;
    setMediaUrl(url);
    setMediaFile(null);
    if (mediaType === 'image') {
      setPreviewUrl(url);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }
      setMediaFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaUrl(reader.result);
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    if (mediaType !== 'none' && !mediaUrl) {
      setError('Please provide a media URL or upload an image.');
      return;
    }

    if (mediaType === 'embed' && !isValidUrl(mediaUrl)) {
      setError('Please provide a valid URL for embedding.');
      return;
    }

    setIsLoading(true);

    const newPost = { 
      title: title.trim(), 
      content: content.trim(), 
      mediaType: mediaType === 'none' ? null : mediaType,
      mediaUrl: mediaType === 'none' ? null : mediaUrl
    };

    try {
      const response = await createNews(newPost);
      if (response.success) {
        onNewsAdded(response.data);
        onClose();
      } else {
        setError(response.message || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to create news post.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className={classes.modalOverlay}>
      <div className={classes.modalContent}>
        <header className={classes.modalHeader}>
          <h4>Create News Post</h4>
          <button
            className={classes.modalCloseButton}
            onClick={onClose}
            disabled={isLoading}
          >
            <IoMdClose />
          </button>
        </header>

        <form onSubmit={handleSubmit} className={classes.modalForm}>
          {error && <p className={classes.formError}>{error}</p>}
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="news-title">
              Title
            </label>
            <input
              id="news-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              placeholder="Enter news title"
              className={classes.fieldControl}
            />
          </div>
          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="news-content">
              Content
            </label>
            <textarea
              id="news-content"
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              placeholder="Write your news post here..."
              className={`${classes.fieldControl} ${classes.fieldTextarea}`}
            />
          </div>

          <div className={classes.fieldGroup}>
            <label className={classes.fieldLabel} htmlFor="news-media-type">
              Media
            </label>
            <select
              id="news-media-type"
              value={mediaType}
              onChange={handleMediaTypeChange}
              disabled={isLoading}
              className={classes.fieldControl}
            >
              <option value="none">No media</option>
              <option value="image">Image</option>
              <option value="embed">Embed (YouTube/URL)</option>
            </select>

            {mediaType === 'image' && (
              <div className={classes.mediaStack}>
                <label className={classes.fileDrop} htmlFor="news-image">
                  <input
                    id="news-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/avif"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                    className={classes.fileInput}
                  />
                  <div className={classes.fileDropContent}>
                    <span className={classes.fileDropTitle}>Upload a feature image</span>
                    <span className={classes.fileDropHint}>
                      PNG, JPG, WEBP, or AVIF up to 5MB.
                    </span>
                  </div>
                  <div className={classes.fileMeta}>
                    {mediaFile
                      ? `${mediaFile.name} (${formatFileSize(mediaFile.size)})`
                      : 'No file selected'}
                  </div>
                </label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={handleMediaUrlChange}
                  placeholder="Or paste an image URL"
                  disabled={isLoading}
                  className={classes.fieldControl}
                />
                {previewUrl && (
                  <div className={classes.preview}>
                    <img src={previewUrl} alt="Preview" className={classes.previewImage} />
                  </div>
                )}
              </div>
            )}

            {mediaType === 'embed' && (
              <div className={classes.mediaStack}>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={handleMediaUrlChange}
                  placeholder="Enter YouTube URL or website link"
                  disabled={isLoading}
                  className={classes.fieldControl}
                />
                <span className={classes.fieldHint}>
                  Use a full URL starting with https://
                </span>
              </div>
            )}
          </div>

          <div className={classes.modalFooter}>
            <button
              type="button"
              className="btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary" disabled={isLoading}>
              {isLoading ? 'Posting...' : 'Post News'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default AddNewsModal;
