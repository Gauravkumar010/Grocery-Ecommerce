// src/layouts/AuthLayout.jsx

import { Link, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-surface-dark px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <span className="text-3xl font-extrabold text-primary-600">Grocery</span>
        </Link>
        <div className="card p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;