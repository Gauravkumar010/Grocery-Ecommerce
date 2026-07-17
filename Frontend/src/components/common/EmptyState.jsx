// src/components/common/EmptyState.jsx

import { Link } from 'react-router-dom';

const EmptyState = ({ icon, title, subtitle, actionLabel, actionTo }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="text-6xl mb-4 opacity-50">{icon}</div>}
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h2>
      {subtitle && <p className="text-gray-500 mb-6 max-w-sm">{subtitle}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn-primary px-6 py-2.5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
};

export default EmptyState;