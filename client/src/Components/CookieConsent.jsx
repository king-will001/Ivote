import React, { useState, useEffect, useCallback } from 'react';

const CONSENT_KEY = 'ivote_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so the banner slides in after page load
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Trigger entrance animation after visible is set
  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [visible]);

  const handleAccept = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 350);
  }, []);

  const handleDecline = useCallback(() => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 350);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`cookie-banner${animateIn ? ' cookie-banner--visible' : ''}`}
      role='dialog'
      aria-label='Cookie consent'
      aria-live='polite'
    >
      <div className='cookie-banner-inner container'>
        <div className='cookie-banner-text'>
          <strong>🍪 We value your privacy</strong>
          <p>
            IVote uses essential cookies to maintain your session and secure your vote.
            Optional analytics cookies help us improve the platform. You can accept or
            decline optional cookies.
          </p>
        </div>
        <div className='cookie-banner-actions'>
          <button
            type='button'
            className='btn primary cookie-btn'
            onClick={handleAccept}
            autoFocus
          >
            Accept All
          </button>
          <button
            type='button'
            className='btn cookie-btn'
            onClick={handleDecline}
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
