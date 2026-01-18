import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import ErrorPage from './ErrorPage';

function RootLayout() {
  const location = useLocation();
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
    };
  }, []);

  // Add all paths where the navbar should be hidden
  const hideNavbarPaths = ['/login', '/register', '/forgot-password'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  if (!isOnline) {
    return (
      <ErrorPage
        variant="offline"
        code="Offline"
        message="No connection"
        description="You appear to be offline. Check your internet connection and try again."
      />
    );
  }

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <Outlet />
      <Footer />
    </>
  );
}

export default RootLayout;
