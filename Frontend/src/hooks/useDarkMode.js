// src/hooks/useDarkMode.js

import { useSelector, useDispatch } from 'react-redux';
import { toggleTheme } from '../redux/slices/themeSlice';

const useDarkMode = () => {
  const mode = useSelector((state) => state.theme.mode);
  const dispatch = useDispatch();

  return {
    isDark: mode === 'dark',
    toggle: () => dispatch(toggleTheme()),
  };
};

export default useDarkMode;