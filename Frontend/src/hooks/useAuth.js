// src/hooks/useAuth.js

import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/slices/authSlice';

const useAuth = () => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    loading,
    logout: () => dispatch(logoutUser()),
  };
};

export default useAuth;