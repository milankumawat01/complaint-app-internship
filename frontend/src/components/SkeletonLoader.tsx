
type SkeletonLoaderProps = {
  count?: number;
};

function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-16 w-full animate-pulse rounded-lg bg-gray-200"
        />
      ))}
    </div>
  );
}

export default SkeletonLoader;
