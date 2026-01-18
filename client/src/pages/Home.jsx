import React, { useState, useEffect, useContext } from 'react';
import { fetchNews, NEWS_CATEGORIES, deleteNews } from '../utils/apiSimulator';
import NewsPost from '../Components/NewsPost';
import AddNewsModal from '../Components/AddNewsModal';
import Loader from '../Components/Loader';
import { UserContext } from '../context/userContext';

const Home = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [deletingPostId, setDeletingPostId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const { currentUser } = useContext(UserContext);
  const [showAddModal, setShowAddModal] = useState(false);
  const isAdmin = currentUser?.isAdmin || currentUser?.voter?.isAdmin;
  const categories = ['All', ...NEWS_CATEGORIES];
  const normalizedQuery = appliedQuery.trim().toLowerCase();
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const buildSearchableText = (post) => (
    [post?.title, post?.content, post?.author, post?.category, post?.summary, post?.description]
      .filter((value) => typeof value === 'string' && value.trim())
      .join(' ')
      .toLowerCase()
  );
  const categoryFilteredNews = selectedCategory === 'All'
    ? news
    : news.filter((post) => {
      const postCategory = typeof post?.category === 'string' ? post.category.trim() : '';
      return postCategory && postCategory.toLowerCase() === selectedCategory.toLowerCase();
    });
  const filteredNews = queryTokens.length
    ? categoryFilteredNews.filter((post) => {
      const searchable = (typeof post?.searchText === 'string' && post.searchText)
        ? post.searchText
        : buildSearchableText(post);
      return queryTokens.every((token) => searchable.includes(token));
    })
    : categoryFilteredNews;
  const hasActiveFilters = selectedCategory !== 'All' || normalizedQuery.length > 0;
  const pendingDeleteTitle = typeof pendingDelete?.title === 'string' ? pendingDelete.title.trim() : '';
  const deleteInProgress = Boolean(pendingDelete && deletingPostId === pendingDelete.id);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedQuery(searchQuery);
  };

  useEffect(() => {
    loadNews();
  }, []);

  useEffect(() => {
    if (!pendingDelete) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && deletingPostId !== pendingDelete.id) {
        setPendingDelete(null);
      }
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pendingDelete, deletingPostId]);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      const response = await fetchNews();
      if (response.success) {
        setNews(response.data);
      } else {
        setError(response.message || 'Failed to load news feed');
      }
    } catch (err) {
      setError('An error occurred while loading the news feed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsAdded = (newPost) => {
    setNews([newPost, ...news]);
    setShowAddModal(false);
  };

  const handleDeleteRequest = (post) => {
    const postId = post?._id;
    if (!postId) return;
    const title = typeof post?.title === 'string' ? post.title.trim() : '';
    setPendingDelete({ id: postId, title });
  };

  const handleDeleteCancel = () => {
    if (deleteInProgress) return;
    setPendingDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDelete?.id) return;
    try {
      await handleDeletePost(pendingDelete.id);
    } finally {
      setPendingDelete(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!postId) return;
    setDeletingPostId(postId);
    setError(null);
    try {
      const response = await deleteNews(postId);
      if (response.success) {
        setNews((prev) =>
          prev.filter((post) => (post._id || post.id) !== postId)
        );
        return;
      }
      setError(response.message || 'Failed to delete news post');
    } catch (err) {
      setError('Failed to delete news post');
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <main className="container">
      <section className="news_header">
        <div className="news_header-content">
          <span className="news_kicker">IvoTe Newsroom</span>
          <h1>News & Updates</h1>
          <p className="news_subtitle">
            Curated technology, health, and education coverage with updates from your admins.
          </p>
        </div>
        <div className="news_header-actions">
          <div className="news_stat">
            <span className="news_stat-label">Total posts</span>
            <span className="news_stat-value">{news.length}</span>
          </div>
          {isAdmin && (
            <button 
              className="btn primary" 
              onClick={() => setShowAddModal(true)}
            >
              Create Post
            </button>
          )}
        </div>
      </section>

      <section className="news_toolbar" aria-label="News tools">
        <div className="news_search">
          <label htmlFor="newsSearch" className="news_search-label">Search</label>
          <form className="news_search-field" onSubmit={handleSearchSubmit}>
            <input
              id="newsSearch"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search headlines, topics, or authors"
            />
            <button
              type="submit"
              className="news_search-button"
              aria-label="Search news"
            >
              Search
            </button>
          </form>
        </div>
        <div className="news_filters" aria-label="News categories">
          <span className="news_filters-label">Category</span>
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                className={`news_filter-btn ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
                aria-pressed={isActive}
              >
                {category}
              </button>
            );
          })}
        </div>
        <div className="news_results" aria-live="polite">
          <span className="news_results-label">Showing</span>
          <span className="news_results-value">{filteredNews.length}</span>
          <span className="news_results-total">of {news.length}</span>
        </div>
      </section>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadNews} className="btn">
            Try Again
          </button>
        </div>
      )}

      {isLoading ? (
        <Loader label="Loading news feed..." size="lg" fullPage />
      ) : news.length === 0 ? (
        <div className="empty-state">
          <p>No news posts yet.</p>
          {isAdmin && (
            <button 
              className="btn primary" 
              onClick={() => setShowAddModal(true)}
            >
              Create the first post
            </button>
          )}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="empty-state">
          <p>
            {normalizedQuery
              ? `No results for "${searchQuery.trim()}".`
              : 'No news posts in this category.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
                setAppliedQuery('');
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="news_grid">
          {filteredNews.map((post) => {
            const postId = post._id || null;
            const detailHref = post?.id ? `/news/${encodeURIComponent(post.id)}` : null;
            return (
              <NewsPost
                key={post.id}
                {...post}
                searchTokens={queryTokens}
                detailHref={detailHref}
                detailState={post}
                canDelete={isAdmin && Boolean(postId)}
                isDeleting={deletingPostId === postId}
                onDelete={() => handleDeleteRequest(post)}
              />
            );
          })}
        </div>
      )}

      {pendingDelete && (
        <section
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-news-title"
        >
          <div className="modal_content">
            <header className="modal_header">
              <h4 id="delete-news-title">Delete news post</h4>
              <button
                type="button"
                className="close_modal-btn"
                onClick={handleDeleteCancel}
                aria-label="Close delete confirmation"
                disabled={deleteInProgress}
              >
                &times;
              </button>
            </header>
            <p>Delete this news post? This action cannot be undone.</p>
            {pendingDeleteTitle && (
              <p><strong>{pendingDeleteTitle}</strong></p>
            )}
            <div className="modal_footer">
              <button
                type="button"
                className="btn"
                onClick={handleDeleteCancel}
                disabled={deleteInProgress}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={handleDeleteConfirm}
                disabled={deleteInProgress}
              >
                {deleteInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </section>
      )}

      {showAddModal && (
        <AddNewsModal
          onClose={() => setShowAddModal(false)}
          onNewsAdded={handleNewsAdded}
        />
      )}
    </main>
  );
};

export default Home;
