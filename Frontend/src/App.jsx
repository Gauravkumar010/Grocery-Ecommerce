// src/App.jsx

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCurrentUser } from './redux/slices/authSlice';
import AppRoutes from './routes/AppRoutes';

function App() {
  const theme = useSelector((state) => state.theme.mode);
  const { accessToken, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Apply/remove the 'dark' class on <html> whenever theme state changes —
  // this is what actually activates all our dark: Tailwind classes.
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // On initial app load, if we have a stored token, verify it's still
  // valid and refresh the user data from the server (in case profile
  // was updated on another device, etc.)
  useEffect(() => {
    if (accessToken && isAuthenticated) {
      dispatch(fetchCurrentUser());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AppRoutes />;
}

export default App;