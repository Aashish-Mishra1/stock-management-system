import { ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { getCurrentToken, getCurrentUser, logoutUser } from '../../redux/services/authSlice';
import { Navigate } from 'react-router-dom';

const ProtectRoute = ({ children }: { children: ReactNode }) => {
  const user = useAppSelector(getCurrentUser);
  const token = useAppSelector(getCurrentToken);
  const dispatch = useAppDispatch();

  if (!user || !token) {
    return <Navigate to='/login' replace={true} />;
  }

  // Check token expiry
  const isExpired = user.exp * 1000 < Date.now();
  if (isExpired) {
    dispatch(logoutUser());
    return <Navigate to='/login' replace={true} />;
  }

  return children;
};

export default ProtectRoute;
