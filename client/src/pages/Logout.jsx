import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearAuth } from '../utils/authStorage';
import { logoutUser } from '../utils/apiSimulator';
import { authActions } from '../store/authSlice';

function Logout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logoutUser();
      } finally {
        clearAuth();
        dispatch(authActions.clearAuth());
        navigate('/login');
      }
    };

    performLogout();
  }, [dispatch, navigate]);

  return (
    <section className='register'>
      <div className='container register_container'>
        <h2>Signing out...</h2>
      </div>
    </section>
  );
}

export default Logout;
