import React, { useContext } from 'react';
import { UserContext } from '../context/userContext';
import AdminDashboard from '../Components/AdminDashboard';
import ErrorPage from './ErrorPage';

const Admin = () => {
  const { currentUser } = useContext(UserContext);
  const isAdmin = currentUser?.isAdmin || currentUser?.voter?.isAdmin;

  if (!isAdmin) {
    return (
      <ErrorPage 
        code="403" 
        message="Access Denied" 
        description="You do not have permission to access the admin panel."
      />
    );
  }

  return (
    <div className="admin-page">
      <AdminDashboard />
    </div>
  );
};

export default Admin;
