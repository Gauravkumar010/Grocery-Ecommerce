// src/components/admin/StatsCard.jsx

const StatsCard = ({ icon: Icon, label, value, accent = 'primary' }) => {
  const colors = {
    primary: 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400',
    accent: 'bg-accent-100 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colors[accent]}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatsCard;