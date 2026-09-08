import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
import CookieConsent from '../Components/CookieConsent';
import { authActions } from '../store/authSlice';
import { clearAuth, loadAuth, saveAuth } from '../utils/authStorage';
import { refreshSession } from '../utils/apiSimulator';

function RootLayout() {
  const location = useLocation();
  const dispatch = useDispatch();
  const bootstrapped = useRef(false);

  // Add all paths where the navbar should be hidden
  const hideNavbarPaths = ['/login', '/register'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const bootstrapSession = async () => {
      const cached = loadAuth();
      if (cached?.user) {
        dispatch(authActions.setAuth({ token: null, user: cached.user }));
      }

      const response = await refreshSession();
      if (response.success && response.data?.voter) {
        const authPayload = { token: null, user: response.data.voter };
        saveAuth(authPayload);
        dispatch(authActions.setAuth(authPayload));
        return;
      }

      clearAuth();
      dispatch(authActions.clearAuth());
    };

    bootstrapSession();
  }, [dispatch]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div className='app_shell'>
      {/* Skip navigation link for keyboard users */}
      <a href='#main-content' className='skip-nav'>
        Skip to main content
      </a>
      {!shouldHideNavbar && <Navbar />}
      <main id='main-content' className='app_content' tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <CookieConsent />
    </div>
  );
}

export default RootLayout;
