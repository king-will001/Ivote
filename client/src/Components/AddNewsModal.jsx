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

  const handleMediaTypeChange = (e) => {
    setMediaType(e.target.value);
    setMediaUrl('');
    setPreviewUrl('');
  };

  const handleMediaUrlChange = (e) => {
    const url = e.target.value;
    setMediaUrl(url);
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
      title, 
      content, 
      author: 'Admin',
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div>
            <h6>Title</h6>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              placeholder="Enter news title"
            />
          </div>
          <div>
            <h6>Content</h6>
            <textarea
              rows="5"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isLoading}
              placeholder="Write your news post here..."
            />
          </div>

          <div>
            <h6>Media</h6>
            <select
              value={mediaType}
              onChange={handleMediaTypeChange}
              disabled={isLoading}
              className={classes.select}
            >
              <option value="none">No media</option>
              <option value="image">Image</option>
              <option value="embed">Embed (YouTube/URL)</option>
            </select>

            {mediaType === 'image' && (
              <>
                <div className={classes.mediaInput}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isLoading}
                  />
                  <span>or</span>
                  <input
                    type="text"
                    value={mediaUrl}
                    onChange={handleMediaUrlChange}
                    placeholder="Enter image URL"
                    disabled={isLoading}
                  />
                </div>
                {previewUrl && (
                  <div className={classes.preview}>
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      style={{ maxWidth: '100%', maxHeight: '200px' }} 
                    />
                  </div>
                )}
              </>
            )}

            {mediaType === 'embed' && (
              <div className={classes.mediaInput}>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={handleMediaUrlChange}
                  placeholder="Enter YouTube URL or website link"
                  disabled={isLoading}
                />
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
