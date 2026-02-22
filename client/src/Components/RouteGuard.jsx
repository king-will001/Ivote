import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

export const RequireAuth = ({ children }) => {
  const user = useSelector((state) => state.auth?.user)
  const location = useLocation()

  if (!user?.id) {
    return <Navigate to='/login' replace state={{ from: location }} />
  }

  return children
}

export const RequireAdmin = ({ children }) => {
  const user = useSelector((state) => state.auth?.user)
  const location = useLocation()

  if (!user?.isAdmin) {
    return <Navigate to='/' replace state={{ from: location }} />
  }

  return children
}
