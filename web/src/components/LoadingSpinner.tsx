export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-ember border-t-transparent rounded-full" />
    </div>
  );
}
