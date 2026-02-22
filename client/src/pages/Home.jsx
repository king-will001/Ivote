import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { fetchNews } from '../utils/apiSimulator';
import NewsPost from '../Components/NewsPost';
import AddNewsModal from '../Components/AddNewsModal';

const Home = () => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const user = useSelector((state) => state.auth?.user);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const newsStats = useMemo(() => {
    const categories = new Set();
    let latestDate = null;
    news.forEach((post) => {
      if (post?.category) {
        categories.add(post.category);
      }
      const dateValue = post?.date ? new Date(post.date).getTime() : NaN;
      if (!Number.isNaN(dateValue)) {
        latestDate = latestDate ? Math.max(latestDate, dateValue) : dateValue;
      }
    });
    return {
      totalPosts: news.length,
      categoryCount: categories.size || 0,
      latestLabel: latestDate ? new Date(latestDate).toLocaleDateString() : 'No updates',
    };
  }, [news]);

  const loadNews = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetchNews();
      if (response.success) {
        setNews(response.data);
      } else {
        setError('Failed to load news feed');
      }
    } catch (err) {
      setError('An error occurred while loading the news feed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewsAdded = (newPost) => {
    setNews((prev) => [newPost, ...prev]);
    setShowAddModal(false);
  };

  return (
    <main className="container">
      <section className="news_header">
        <div className="news_header-content">
          <span className="news_kicker">IVote Dispatch</span>
          <h1>News & Updates</h1>
          <p className="news_subtitle">
            Verified election updates, announcements, and community highlights in one feed.
          </p>
        </div>
        <div className="news_header-actions">
          <div className="news_stat">
            <span className="news_stat-label">Posts</span>
            <span className="news_stat-value">{newsStats.totalPosts}</span>
            <span className="news_stat-meta">Latest: {newsStats.latestLabel}</span>
          </div>
          <div className="news_stat">
            <span className="news_stat-label">Categories</span>
            <span className="news_stat-value">{newsStats.categoryCount}</span>
            <span className="news_stat-meta">Curated topics</span>
          </div>
          {user?.isAdmin && (
            <button
              className="btn primary"
              onClick={() => setShowAddModal(true)}
            >
              Create Post
            </button>
          )}
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
        <div className="loading-state">Loading news feed...</div>
      ) : news.length === 0 ? (
        <div className="empty-state">
          <p>No news posts yet.</p>
          {user?.isAdmin && (
            <button 
              className="btn primary" 
              onClick={() => setShowAddModal(true)}
            >
              Create the first post
            </button>
          )}
        </div>
      ) : (
        <div className="news_grid">
          {news.map((post) => (
            <NewsPost key={post.id} {...post} />
          ))}
        </div>
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
