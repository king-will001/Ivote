import React, { useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../context/userContext';

function Logout() {
  const { setCurrentUser } = useContext(UserContext);

  useEffect(() => {
    setCurrentUser(null);
  }, [setCurrentUser]);

  return <Navigate to="/login" replace />;
}

export default Logout;
