
type EmptyStateProps = {
  title?: string;
  message?: string;
};

function EmptyState({
  title = "No data found",
  message = "There is nothing to display right now.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <h3 className="text-lg font-semibold text-gray-700">
        {title}
      </h3>

      <p className="mt-2 text-sm text-gray-500">
        {message}
      </p>
    </div>
  );
}

export default EmptyState;
