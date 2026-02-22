import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Navbar from '../Components/Navbar';
import Footer from '../Components/Footer';
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

  return (
    <div className="app_shell">
      {!shouldHideNavbar && <Navbar />}
      <main className="app_content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default RootLayout;
