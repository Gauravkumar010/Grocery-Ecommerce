// src/components/common/Skeleton.jsx

const Skeleton = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-xl ${className}`}
    />
  );
};

export const ProductCardSkeleton = () => (
  <div className="card p-3">
    <Skeleton className="w-full aspect-square mb-3" />
    <Skeleton className="h-4 w-3/4 mb-2" />
    <Skeleton className="h-3 w-1/2 mb-3" />
    <Skeleton className="h-8 w-full" />
  </div>
);

export default Skeleton;