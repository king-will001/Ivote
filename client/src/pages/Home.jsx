import React, { useState, useEffect } from 'react';
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

  const loadNews = async () => {
    try {
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
    setNews([newPost, ...news]);
    setShowAddModal(false);
  };

  return (
    <main className="container">
      <section className="news_header">
        <h1>News & Updates</h1>
        {user?.isAdmin && (
          <button 
            className="btn primary" 
            onClick={() => setShowAddModal(true)}
          >
            Create Post
          </button>
        )}
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
