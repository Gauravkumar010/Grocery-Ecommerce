// src/components/common/Badge.jsx

const VARIANTS = {
  primary: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const Badge = ({ children, variant = 'gray', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;