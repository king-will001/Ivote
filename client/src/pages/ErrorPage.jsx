import React, { useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import errorImage from '../assets/error.gif'; // Adjust the path and filename

const ErrorPage = ({
  code,
  message,
  description,
  autoRedirect = true,
  variant,
}) => {
  const navigate = useNavigate();
  const error = useRouteError();
  const isOffline = variant === 'offline';
  const hasRouteError = Boolean(error);
  const shouldAutoRedirect = autoRedirect;
  const title = message || (isOffline ? 'No connection' : 'Oops');
  const fallbackDescription = isOffline
    ? 'You appear to be offline. Check your internet connection and try again.'
    : (shouldAutoRedirect ? 'Something went wrong. You will be redirected shortly.' : 'Something went wrong.');
  const detailMessage = description || fallbackDescription;
  const statusLabel = code || (isOffline ? 'Offline' : null);
  const showDetails = hasRouteError && !isOffline;
  const imageAlt = isOffline ? 'Offline' : 'Error';

  useEffect(() => {
    if (!shouldAutoRedirect) return undefined;
    const timer = setTimeout(() => {
      navigate(-1);
    }, 7000);

    return () => clearTimeout(timer);
  }, [navigate, shouldAutoRedirect]);

  // Also log the route error to the console for easier debugging
  useEffect(() => {
    if (error) console.error('Route error:', error);
  }, [error]);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('error-page-active');
    return () => {
      document.body.classList.remove('error-page-active');
    };
  }, []);

  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <section className="errorPage">
      <div className="errorPage_container">
        <img src={errorImage} alt={imageAlt} />
        {statusLabel && <span className="errorPage_code">{statusLabel}</span>}
        <h1>{title}</h1>
        <p>{detailMessage}</p>
        {isOffline && (
          <div className="errorPage_actions">
            <button type="button" className="btn primary" onClick={handleRetry}>
              Try again
            </button>
          </div>
        )}
        {showDetails && (
          <div className="errorPage_detail">
            <strong>Error:</strong>
            <pre>{String(error?.message || error)}</pre>
          </div>
        )}
      </div>
    </section>
  );
};

export default ErrorPage;
