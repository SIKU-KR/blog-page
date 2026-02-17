/**
 * Admin dashboard loading skeleton
 * Shows while admin content is loading
 */
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      {/* Admin Header Skeleton */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded" />
            <div className="flex items-center gap-4">
              <div className="h-8 w-24 bg-gray-200 rounded" />
              <div className="h-8 w-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/6 bg-gray-200 rounded" />
              <div className="h-4 w-1/6 bg-gray-200 rounded" />
              <div className="h-4 w-1/6 bg-gray-200 rounded" />
            </div>
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-6 py-4 border-b border-gray-100">
              <div className="flex gap-4">
                <div className="h-4 w-1/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/6 bg-gray-200 rounded" />
                <div className="h-4 w-1/6 bg-gray-200 rounded" />
                <div className="h-4 w-1/6 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
