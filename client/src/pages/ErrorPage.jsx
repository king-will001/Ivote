import React, { useEffect } from 'react';
import { useNavigate, useRouteError } from 'react-router-dom';
import errorImage from '../assets/error.gif'; // Adjust the path and filename

const ErrorPage = () => {
  const navigate = useNavigate();
  const error = useRouteError();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(-1);
    }, 7000);

    return () => clearTimeout(timer);
  }, [navigate]);

  // Also log the route error to the console for easier debugging
  React.useEffect(() => {
    if (error) console.error('Route error:', error);
  }, [error]);

  return (
    <section className="errorPage">
      <div className="errorPage_container">
        <img src={errorImage} alt="Error Page" />
        <h1>Oops</h1>
        <p>Something went wrong. You will be redirected shortly.</p>
        {error && (
          <div style={{ marginTop: '1rem', color: '#fff', textAlign: 'left' }}>
            <strong>Error:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#ffdcdc' }}>{String(error?.message || error)}</pre>
          </div>
        )}
      </div>
    </section>
  );
};

export default ErrorPage;
