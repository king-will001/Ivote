import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import errorImage from '../assets/error.gif'; // Adjust the path and filename

const ErrorPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(-1);
    }, 7000);

    // Clear timeout on unmount
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="errorPage">
      <div className="errorPage_container">
        <img src={errorImage} alt="Error Page" />
        <h1>404</h1>
        <p>This page does not exist. You will be redirected to the previous page shortly.</p>
      </div>
    </section>
  );
};

export default ErrorPage;
