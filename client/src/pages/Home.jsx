import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  const contentRef = useRef(null);

  useEffect(() => {
    const boundReveal = () => {
      if (contentRef.current) {
        const targets = [...contentRef.current.querySelectorAll('.reveal')];
        const windowBottom = window.innerHeight + 40;
        targets.forEach((node) => {
          if (node.getBoundingClientRect().top < windowBottom) {
            node.classList.add('is-visible');
          }
        });
      }
    };

    boundReveal();
    let revealed = new WeakSet();
    const onScroll = () => {
      const targets = contentRef.current ? [...contentRef.current.querySelectorAll('.reveal:not(.is-visible)')] : [];
      if (targets.length === 0) {
        window.removeEventListener('scroll', onScroll, { passive: true });
        return;
      }
      boundReveal();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll, { passive: true });
      window.removeEventListener('resize', onScroll, { passive: true });
    };
  }, []);

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
      <section className="news_header entrance-up">
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
        <div className="news_grid" ref={contentRef}>
          {news.map((post, index) => (
            <NewsPost
              key={post.id}
              {...post}
              className={`reveal reveal-delay-${Math.min(index, 5)}`}
            />
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
